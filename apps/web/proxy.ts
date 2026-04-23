import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ROUTES = ['/admin'];
const AGENT_ONLY_ROUTES = ['/flights', '/dashboard'];

export function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes - no check needed
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // Not authenticated - redirect to login
  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Decode JWT payload to check role (without verification - verification happens server-side)
  let role: string | undefined;
  try {
    const payload = sessionToken.split('.')[1] ?? '';
    const decoded = JSON.parse(atob(payload));
    role = decoded.role;
  } catch {
    // Invalid token - redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes: block agents
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Agent-only routes: block admins
  if (AGENT_ONLY_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // /bookings list page: redirect admins to /admin/bookings
  // /bookings/[id] detail page: shared - both roles can access
  if (pathname === '/bookings' && role === 'admin') {
    return NextResponse.redirect(new URL('/admin/bookings', request.url));
  }

  // /profile is shared - both roles can access

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
