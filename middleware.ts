import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// This function must be named "middleware" or exported as default
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // List of API routes that should be public (no authentication required)
  const publicApiRoutes = [
    '/api/payment-link',
    '/api/payments/razorpay',
    '/api/razorpay'
  ];
  
  // Check if the current route is in the public routes list
  const isPublicRoute = publicApiRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );
  
  // If it's a public route, allow access without authentication
  if (isPublicRoute) {
    return res;
  }
  
  // Check if the request is to an API route that should be protected
  if (req.nextUrl.pathname.startsWith('/api/') && 
      !req.nextUrl.pathname.startsWith('/api/auth/')) {
    
    // Get session asynchronously
    return (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Try anonymous sign-in if there's no session
      if (!session) {
        try {
          console.log('No session found in middleware, attempting anonymous sign-in');
          const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
          
          if (signInError || !signInData.session) {
            console.error('Anonymous sign-in failed:', signInError);
            return NextResponse.json(
              { error: 'Unauthorized', message: 'Authentication failed' },
              { status: 401 }
            );
          }
          
          console.log('Anonymous sign-in successful');
          // Continue with the request since we now have a session
          return res;
        } catch (error) {
          console.error('Error during anonymous sign-in:', error);
          return NextResponse.json(
            { error: 'Unauthorized', message: 'Authentication error' },
            { status: 401 }
          );
        }
      }
      
      return res;
    })();
  }

  return res;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    '/api/:path*',
    '/services/:path*',
    '/invoices/:path*',
    '/transactions/:path*',
  ],
}; 