import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/jobs', '/applicants', '/screening', '/shortlist'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));

  if (isProtected && !request.cookies.get('auth-session')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/jobs/:path*',
    '/applicants/:path*',
    '/screening/:path*',
    '/shortlist/:path*',
  ],
};
