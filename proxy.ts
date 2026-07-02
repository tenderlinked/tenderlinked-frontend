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
  
  // Get hostname (e.g., demo.localhost:3000)
  const hostname = req.headers.get('host') || 'localhost:3000';

  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`;

  // The main domain where marketing/auth happens
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
  
  const isRootOrLocal = 
    hostname === rootDomain || 
    hostname === `www.${rootDomain}` || 
    hostname.startsWith('127.0.0.1');

  // If we're on the root domain
  if (isRootOrLocal) {
    // Root-level dashboard requests must redirect to the user's tenant subdomain
    if (path.startsWith('/dashboard') || path.startsWith('/checkout') || path.startsWith('/pricing') || path.startsWith('/settings')) {
      const session = req.auth; // Passed automatically by auth()
      
      // @ts-ignore
      const tenantSubdomain = session?.user?.tenantSubdomain || session?.tenantSubdomain || (session as any)?.token?.tenantSubdomain;

      if (session && tenantSubdomain) {
        const protocol = req.headers.get('x-forwarded-proto') || (hostname.includes('localhost') ? 'http' : 'https');
        const newUrl = new URL(path, `${protocol}://${tenantSubdomain}.${rootDomain}`);
        return NextResponse.redirect(newUrl);
      } else if (!session && path.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }
    }
    
    return NextResponse.next();
  }

  // If it's a subdomain, rewrite to our /app/[tenant] route
  const subdomain = hostname.split('.')[0];
  
  console.log(`[DEBUG Proxy] Hostname: ${hostname} | Subdomain: ${subdomain} | Path: ${path}`);
  console.log(`[DEBUG Proxy] Session:`, req.auth ? `authenticated as ${req.auth.user?.email}` : 'NOT authenticated');
  console.log(`[DEBUG Proxy] Received Cookies:`, req.cookies.getAll().map(c => c.name));
  
  // If someone tries to register on a subdomain, redirect to root domain
  if (path.startsWith('/auth/register')) {
    const protocol = req.headers.get('x-forwarded-proto') || (hostname.includes('localhost') ? 'http' : 'https');
    return NextResponse.redirect(new URL('/auth/register', `${protocol}://${rootDomain}`));
  }

  // Allow other authentication (login) to happen directly on subdomains
  if (path.startsWith('/auth') || path.startsWith('/api/auth')) {
    return NextResponse.next();
  }
  
  // If accessing the root of the subdomain, redirect to dashboard
  if (path === '/') {
    const protocol = req.headers.get('x-forwarded-proto') || (hostname.includes('localhost') ? 'http' : 'https');
    return NextResponse.redirect(new URL('/dashboard', `${protocol}://${hostname}`));
  }
  
  // Prevent infinite rewriting if path already starts with /app/
  if (path.startsWith('/app/')) return NextResponse.next();
  
  return NextResponse.rewrite(new URL(`/app/${subdomain}${path}`, req.url));
});
