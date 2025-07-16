import { signOut } from "next-auth/react";

export interface UserSession {
  id: string;
  email: string | null;
  name: string | null;
}

// Client-side helper to get current user session
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
    });
    
    if (response.ok) {
      const session = await response.json();
      return session?.user || null;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

// Client-side helper to logout
export async function logout(): Promise<boolean> {
  try {
    await signOut({ callbackUrl: '/login' });
    return true;
  } catch (error) {
    console.error('Logout failed:', error);
    return false;
  }
}

// Middleware helper to check if a route requires authentication
export function isProtectedRoute(pathname: string): boolean {
  // Don't protect specific workspace routes as they might be public
  // The API will handle permission checks
  if (pathname.match(/^\/workbench\/[a-zA-Z0-9-]+/)) {
    return false;
  }
  
  // Protect the workbench list page
  const protectedPaths = ['/workbench'];
  return protectedPaths.some(path => pathname === path);
}