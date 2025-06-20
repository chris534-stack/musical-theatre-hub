import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next(); // Prepare response object

  // Log Supabase environment variable presence (can be conditional for dev)
  // This logging was moved up to be less conditional than before,
  // and to run before potential redirects.
  if (process.env.NODE_ENV === 'development') {
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log(`[Middleware] Supabase env vars: URL=${hasSupabaseUrl ? 'set' : 'missing'}, KEY=${hasSupabaseKey ? 'set' : 'missing'}`);
  }

  const protectedPaths = ['/reviewer', '/admin'];
  const currentPath = request.nextUrl.pathname;

  // Route protection logic
  if (protectedPaths.some(path => currentPath.startsWith(path))) {
    // For protected routes, create a Supabase client.
    // We need to pass `request` and `response` to `createPagesServerClient`.
    const supabase = createPagesServerClient({ req: request, res: response });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const loginUrl = new URL('/get-involved#reviewer-signin', request.url);
      console.log(`[Middleware] No session for protected route ${currentPath}. Redirecting to ${loginUrl.toString()}`);
      return NextResponse.redirect(loginUrl);
    }
    // Optional: Log successful access for authenticated user
    // console.log(`[Middleware] Valid session for ${currentPath}. User: ${session.user.email}`);
  }

  // Existing debug headers and API logging
  // This part is mostly preserved but adapted to use the `response` object
  // initialized at the beginning of the function.
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-Debug-Middleware', 'active');
    if (currentPath.startsWith('/api/')) {
      console.log(`[Middleware] API request to ${currentPath}`);
      // Supabase env var logging is already done above for all dev requests.
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/reviewer/:path*',
    '/admin/:path*',
    '/api/:path*', // Included as per instructions
  ],
};
