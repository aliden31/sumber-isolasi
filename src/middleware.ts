
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  // Always redirect from /login and /register to /dashboard to "turn them off"
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If there's no session, we would typically redirect to login.
  // Since login and register are off, we will let it pass for now.
  // In a real scenario, you might redirect to a different public page.
  if (!session && pathname !== '/dashboard' && pathname !== '/') {
     // Let's allow access to the app even without a session since auth is disabled.
     // If you want to lock it down, you could redirect to a static page.
  }
  
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
