# Our Stage, Eugene

**Next.js + TypeScript app for managing musical-theatre events**

## Project Overview
A centralized, user-friendly website for the Eugene musical theatre community. Built with Next.js (React + TypeScript), it consolidates events, auditions, resources, and community features for all stakeholders.

## Key Features
- Multi-step event creation form (with matinee/main time support)
- Interactive event calendar (auditions, performances, workshops)
- Event detail pages
- Community features (forums, member directory)
- Resource sharing
- Modern, accessible, responsive design
- Easy content management
- Search and navigation
- Security, backups, and performance optimizations

## Required Environment Variables

For the application to build and run correctly, certain environment variables must be set. These variables are essential for connecting to backend services like Supabase and Firebase. Ensure you have a `.env.local` file in the root of your project with the following variables defined:

-   `NEXT_PUBLIC_SUPABASE_URL`: The URL for your Supabase project.
-   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous public key for your Supabase project.
-   `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase project API Key.
-   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase project Auth Domain.
-   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID.
-   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase project Storage Bucket.
-   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase project Messaging Sender ID.
-   `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase project App ID.
-   `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: (Optional) Firebase project Measurement ID, if Firebase Analytics is actively used.

These variables are prefixed with `NEXT_PUBLIC_` to be exposed to the browser, as per Next.js conventions for client-side accessible environment variables. They are crucial for the application to initialize and interact with these backend services. Without them, the build process may fail, or the application will not function as expected at runtime.

## Setup Instructions
1. Clone this repository and install dependencies:
   ```
   git clone https://github.com/chris534-stack/musical-theatre-hub.git
   cd musical-theatre-hub
   npm install
   ```
2. Copy `.env.local.example` to `.env.local` and configure your environment variables.
3. Run the development server:
   ```
   npm run dev
   ```
4. Access the site at `http://localhost:3000`.

## Maintenance Plan
- Weekly: Update dependencies. Backup site.
- Monthly: Review analytics, update content, check performance.
- As needed: Security scans, user feedback, add new features.

---

For detailed requirements, plugin/theme recommendations, and templates, see the accompanying files in this repository.
