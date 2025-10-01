
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  // Always redirect from /login to /dashboard to "turn it off"
  if (pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If there's no session and the user is not trying to access login/register
  if (!session && !pathname.startsWith('/register')) {
    // Since /login is off, we can't redirect there. 
    // For now, we will let it pass, but a real-world scenario might redirect to a "coming soon" or home page.
    // Let's redirect to register page instead as a fallback.
    return NextResponse.redirect(new URL('/register', request.url));
  }

  // If there is a session and the user tries to access register, redirect to dashboard
  if (session && pathname.startsWith('/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
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
