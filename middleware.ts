import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  const isLoginPage = request.nextUrl.pathname === '/login';

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Anything with a dot in it is a file, not a screen. The old list named a
    // few by hand and missed /sw.js, so the service worker fetched a 307 to
    // /login and the browser refused to register it — which took push
    // notifications down with it. Fonts and icons were losing the same way.
    '/((?!api|_next/static|_next/image|.*\\..*).*)',
  ],
};
