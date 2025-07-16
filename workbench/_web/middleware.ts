import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { isProtectedRoute } from "@/lib/session"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  // If user is authenticated and tries to access login page, redirect to workbench
  if (pathname === '/login' && isAuthenticated) {
    const workbenchUrl = new URL('/workbench', req.url)
    return NextResponse.redirect(workbenchUrl)
  }

  // Check if this is a protected route
  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      // User is not authenticated, redirect to login
      const loginUrl = new URL('/login', req.url)
      // Add the attempted URL as a query parameter for redirect after login
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Allow the request to continue
  return NextResponse.next()
})

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