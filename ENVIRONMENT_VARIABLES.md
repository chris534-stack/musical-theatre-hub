# Environment Variables

This document lists the environment variables required for the application to function correctly, particularly those related to Supabase integration and administrative features.

## Supabase Configuration

These variables are essential for connecting to and interacting with your Supabase backend.

*   **`NEXT_PUBLIC_SUPABASE_URL`**
    *   **Description:** The public URL for your Supabase project.
    *   **Usage:** Used by the client-side Supabase library (`@supabase/supabase-js` and `@supabase/auth-helpers-nextjs`) to connect to your Supabase instance.
    *   **Example:** `https://your-project-id.supabase.co`

*   **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
    *   **Description:** The public anonymous key for your Supabase project.
    *   **Usage:** Used by the client-side Supabase library. This key allows unauthenticated access according to your Row Level Security (RLS) policies.
    *   **Example:** `eyJhGc...`

*   **`SUPABASE_SERVICE_ROLE_KEY`**
    *   **Description:** The secret service role key for your Supabase project. This key can bypass Row Level Security.
    *   **Usage:** Used for admin-level backend operations where RLS needs to be bypassed, such as in specific API routes (e.g., `pages/api/approve-reviewer.ts`).
    *   **Security Note:** This key is highly sensitive and **must not** be prefixed with `NEXT_PUBLIC_`. It should only be used on the server-side and kept secret. Do not expose it to the client.

## Application Configuration

These variables control application-specific features and administrative access.

*   **`NEXT_PUBLIC_ADMIN_EMAILS`**
    *   **Description:** A comma-separated list of email addresses for users who should have administrative privileges within the application.
    *   **Usage:** Used to grant access to admin sections (e.g., `pages/admin/pending-applications.tsx`) and potentially for authorizing certain API actions.
    *   **Example:** `admin1@example.com,admin2@example.com`

*   **`NEXT_PUBLIC_BASE_URL`** (Optional but Recommended)
    *   **Description:** The canonical base URL of your application.
    *   **Usage:** Primarily used to construct absolute redirect URLs, especially for OAuth callbacks or links sent from server-side processes. For example, it's used in `lib/supabaseClient.ts` to help form OAuth redirect URLs.
    *   **Example:** `http://localhost:3000` (for local development) or `https://www.yourdomain.com` (for production).

## Important Notes

*   **Client-Side vs. Server-Side:**
    *   Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser (client-side). Do not put any sensitive information in these variables.
    *   Variables without the `NEXT_PUBLIC_` prefix (like `SUPABASE_SERVICE_ROLE_KEY`) are only available on the server-side (Node.js environment, including API routes and middleware in some contexts). These should be used for secret keys.

*   **Deployment Environments:**
    *   Ensure that all required environment variables are correctly set up in your local development environment (e.g., via a `.env.local` file) and in all your deployment environments (e.g., Vercel, Netlify, AWS). Missing or incorrect variables are a common source of errors.

*   **Security:**
    *   Never commit your `.env.local` file or files containing sensitive keys (like `SUPABASE_SERVICE_ROLE_KEY`) to your version control system (Git). Use a `.gitignore` file to exclude them. Provide a template (e.g., `.env.example`) for other developers.
