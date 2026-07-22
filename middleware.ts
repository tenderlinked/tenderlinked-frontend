import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, etc.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};

export default auth(async (req) => {
  const url = req.nextUrl;
  const path = url.pathname;
  const hostname = req.headers.get('host') || 'localhost:3000';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
  
  const isRootOrLocal = 
    hostname === rootDomain || 
    hostname === `www.${rootDomain}` || 
    hostname.startsWith('127.0.0.1') ||
    hostname === 'localhost:3000';

  // Force redirect subdomains to root domain
  if (!isRootOrLocal && hostname.endsWith(`.${rootDomain}`)) {
    const protocol = req.headers.get('x-forwarded-proto') || (hostname.includes('localhost') || hostname.includes('lvh.me') ? 'http' : 'https');
    return NextResponse.redirect(new URL(url.pathname + url.search, `${protocol}://${rootDomain}`));
  }

  // Redirect to dashboard if trying to access complete-profile but already has phone number
  if (path.startsWith('/auth/complete-profile')) {
    const session = req.auth;
    // @ts-ignore
    if (session?.user?.phoneNumber) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Protect dashboard routes
  if (path.startsWith('/dashboard') || path.startsWith('/tenders') || path.startsWith('/checkout') || path.startsWith('/pricing') || path.startsWith('/settings') || path.startsWith('/admin')) {
    const session = req.auth; 
    
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Enforce mobile number collection for social logins
    // @ts-ignore
    if (!session.user?.phoneNumber) {
      return NextResponse.redirect(new URL('/auth/complete-profile', req.url));
    }

    // Strictly enforce super admin access at the middleware level
    if (path.startsWith('/admin')) {
      // @ts-ignore
      if (session.user?.globalRole !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  }

  return NextResponse.next();
});
