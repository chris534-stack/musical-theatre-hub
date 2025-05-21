-- Supabase Schema for "reviewers" table

-- Make sure the auth schema is available
CREATE SCHEMA IF NOT EXISTS auth;

-- Create a trigger function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reviewers Table
CREATE TABLE IF NOT EXISTS public.reviewers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    preferred_name TEXT,
    pronouns TEXT,
    reviewer_application_status TEXT DEFAULT 'pending' CHECK (reviewer_application_status IN ('pending', 'approved', 'rejected')),
    applied_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.reviewers IS 'Stores information about users who apply to be reviewers.';
COMMENT ON COLUMN public.reviewers.id IS 'References the user ID from auth.users table.';
COMMENT ON COLUMN public.reviewers.first_name IS 'User''s first name.';
COMMENT ON COLUMN public.reviewers.last_name IS 'User''s last name.';
COMMENT ON COLUMN public.reviewers.preferred_name IS 'User''s preferred name, if different from first name.';
COMMENT ON COLUMN public.reviewers.pronouns IS 'User''s preferred pronouns.';
COMMENT ON COLUMN public.reviewers.reviewer_application_status IS 'Status of their application (pending, approved, rejected).';
COMMENT ON COLUMN public.reviewers.applied_at IS 'Timestamp when the user submitted their application.';
COMMENT ON COLUMN public.reviewers.created_at IS 'Timestamp when the record was created.';
COMMENT ON COLUMN public.reviewers.updated_at IS 'Timestamp when the record was last updated.';

-- Create a trigger to automatically update updated_at on row modification
DROP TRIGGER IF EXISTS on_reviewers_updated ON public.reviewers; -- Drop if exists to avoid errors on re-run
CREATE TRIGGER on_reviewers_updated
BEFORE UPDATE ON public.reviewers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Example of how to enable Row Level Security (RLS) - commented out for now
-- ALTER TABLE public.reviewers ENABLE ROW LEVEL SECURITY;

-- Example Policy: Users can see their own reviewer application
-- CREATE POLICY "Allow users to see their own reviewer application"
-- ON public.reviewers
-- FOR SELECT
-- USING (auth.uid() = id);

-- Example Policy: Admins can see all reviewer applications (assuming an admin role or custom claim)
-- CREATE POLICY "Allow admins to see all reviewer applications"
-- ON public.reviewers
-- FOR SELECT
-- USING (is_admin()); -- This would require a custom is_admin() function or similar check

-- Example Policy: Users can insert their own application
-- CREATE POLICY "Allow users to insert their own reviewer application"
-- ON public.reviewers
-- FOR INSERT
-- WITH CHECK (auth.uid() = id);

-- Example Policy: Users can update their own application (e.g. preferred_name, pronouns)
-- CREATE POLICY "Allow users to update their own reviewer application details"
-- ON public.reviewers
-- FOR UPDATE
-- USING (auth.uid() = id)
-- WITH CHECK (auth.uid() = id);

-- Note: RLS policies should be carefully designed based on specific access requirements.
-- The above are illustrative examples.
-- For the `approve-reviewer` endpoint, an admin or a service role key would be needed to bypass RLS
-- or specific policies would need to allow status changes by authorized users.

-- Seed an initial admin user's reviewer profile if it doesn't exist,
-- This is useful for development and testing.
-- Replace 'your-admin-user-uuid' with the actual UUID of an admin user in your auth.users table.
-- You might need to run this manually after an admin user is created.
/*
DO $$
DECLARE
    admin_user_uuid UUID := 'your-admin-user-uuid'; -- Replace with a real admin UUID from auth.users
    admin_email TEXT := 'admin@example.com'; -- Replace with the admin's email
BEGIN
    -- Check if the user exists in auth.users (optional, as FK constraint handles it)
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = admin_user_uuid) THEN
        -- Insert a reviewer profile for the admin user if it doesn't already exist
        INSERT INTO public.reviewers (id, first_name, last_name, preferred_name, pronouns, reviewer_application_status, applied_at)
        VALUES (
            admin_user_uuid,
            'Admin',       -- Placeholder first name
            'User',        -- Placeholder last name
            'Admin',       -- Placeholder preferred name
            'they/them',   -- Placeholder pronouns
            'approved',    -- Pre-approve admins
            now()
        )
        ON CONFLICT (id) DO NOTHING; -- Do nothing if the reviewer profile already exists
        RAISE NOTICE 'Admin reviewer profile checked/created for user %', admin_email;
    ELSE
        RAISE WARNING 'Admin user with UUID % not found in auth.users. Cannot create reviewer profile.', admin_user_uuid;
    END IF;
END $$;
*/

-- Add any other tables or schema definitions below as needed.
-- For example, if you have a 'news_articles' table:
/*
CREATE TABLE IF NOT EXISTS public.news_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    published_at TIMESTAMPTZ,
    author_id UUID REFERENCES auth.users(id), -- Optional: link to an author user
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS on_news_articles_updated ON public.news_articles;
CREATE TRIGGER on_news_articles_updated
BEFORE UPDATE ON public.news_articles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
*/
-- (The above news_articles is an example, actual schema may vary)
-- Ensure the schema for 'events', 'venues', 'volunteer_requests' is also here if managed via this file.
-- For now, focusing only on the 'reviewers' table as per the task.
