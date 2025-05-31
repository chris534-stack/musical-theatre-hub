import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware can help diagnose Supabase connection issues
export function middleware(request: NextRequest) {
  // Extract the path from the request URL
  const path = request.nextUrl.pathname;
  
  // Add debugging header to responses for certain paths
  if (process.env.NODE_ENV === 'development') {
    const response = NextResponse.next();
    
    // Add diagnostic headers that can help identify issues
    response.headers.set('X-Debug-Middleware', 'active');
    
    // Record API calls that might involve Supabase
    if (path.startsWith('/api/')) {
      console.log(`[Middleware] API request to ${path}`);
      
      // Log Supabase environment variable presence (just checking if defined, not logging values)
      const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
      const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      console.log(`[Middleware] Supabase env vars: URL=${hasSupabaseUrl ? 'set' : 'missing'}, KEY=${hasSupabaseKey ? 'set' : 'missing'}`);
    }
    
    return response;
  }
  
  return NextResponse.next();
}

// Only run middleware on specific paths where we want to monitor for Supabase issues
export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
  ],
};
