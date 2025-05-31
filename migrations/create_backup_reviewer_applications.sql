-- Create a backup table for reviewer applications
-- This will be used when the main reviewers table has connection issues

CREATE TABLE IF NOT EXISTS public.backup_reviewer_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  preferred_name TEXT,
  pronouns TEXT,
  email TEXT NOT NULL,
  reviewer_application_status TEXT NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  error_details TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  succeeded BOOLEAN DEFAULT FALSE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS backup_reviewer_applications_user_id_idx ON public.backup_reviewer_applications (user_id);
CREATE INDEX IF NOT EXISTS backup_reviewer_applications_succeeded_idx ON public.backup_reviewer_applications (succeeded);

-- Set up RLS policies
ALTER TABLE public.backup_reviewer_applications ENABLE ROW LEVEL SECURITY;

-- Admin can see all backup applications
CREATE POLICY "Admins can see all backup applications" 
ON public.backup_reviewer_applications 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid()
  )
);

-- Admin can insert backup applications
CREATE POLICY "Admins can insert backup applications" 
ON public.backup_reviewer_applications 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid()
  )
);

-- Admin can update backup applications
CREATE POLICY "Admins can update backup applications" 
ON public.backup_reviewer_applications 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid()
  )
);

-- Users can insert their own backup applications
CREATE POLICY "Users can insert their own backup applications" 
ON public.backup_reviewer_applications 
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

COMMENT ON TABLE public.backup_reviewer_applications IS 'Backup storage for reviewer applications when main table has connection issues';
