import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(_req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Protect all main app routes — public routes (/, /login, /signup, /api/auth/*) are NOT listed here
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/jobs/:path*',
    '/applicants/:path*',
    '/screening/:path*',
    '/shortlist/:path*',
  ],
};
