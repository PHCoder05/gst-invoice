import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// This function must be named "middleware" or exported as default
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // List of public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/api/payment-link',
    '/api/payments/razorpay',
    '/api/razorpay'
  ];
  
  // Check if the current route is in the public routes list
  const isPublicRoute = publicRoutes.some(route => 
    req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(route + '/')
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

  // Add security headers
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.rzp.io;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https: blob:;
    font-src 'self' data:;
    connect-src 'self' 
      https://api.razorpay.com 
      https://*.razorpay.com
      https://vercel.live 
      https://*.vercel.app 
      https://bctyvhykgrytmtmubwvt.supabase.co
      http://localhost:* 
      http://127.0.0.1:*;
    frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.rzp.io;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    media-src 'self';
    worker-src 'self' blob:;
  `.replace(/\s+/g, ' ').trim();

  // Set security headers
  res.headers.set('Content-Security-Policy', cspHeader);
  
  // Add other security headers
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return res;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    '/',
    '/login',
    '/api/:path*',
    '/services/:path*',
    '/invoices/:path*',
    '/transactions/:path*',
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 