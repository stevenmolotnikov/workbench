import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, isProtectedRoute } from '@/lib/session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSessionFromRequest(request);

  // If user is authenticated and tries to access login page, redirect to workbench
  if (pathname === '/login' && session) {
    const workbenchUrl = new URL('/workbench', request.url);
    return NextResponse.redirect(workbenchUrl);
  }

  // Check if this is a protected route
  if (isProtectedRoute(pathname)) {
    if (!session) {
      // User is not authenticated, redirect to login
      const loginUrl = new URL('/login', request.url);
      // Add the attempted URL as a query parameter for redirect after login
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // User is authenticated, allow the request to continue
    return NextResponse.next();
  }

  // For non-protected routes, just continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (they handle their own auth)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}