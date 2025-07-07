import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

// Use a secure secret in production - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

export interface UserSession {
  id: string;
  email: string;
  name: string | null;
}

export interface SessionPayload extends UserSession {
  iat: number;
  exp: number;
}

export function createToken(user: UserSession): string {
  return jwt.sign(user, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest): SessionPayload | null {
  // Try to get token from cookies first
  const cookieToken = request.cookies.get('session-token')?.value;
  
  if (cookieToken) {
    return verifyToken(cookieToken);
  }

  // Fallback to Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyToken(token);
  }

  return null;
}

export function createSessionResponse(user: UserSession, response?: NextResponse): NextResponse {
  const token = createToken(user);
  
  const res = response || NextResponse.json({
    success: true,
    user,
    message: 'Authentication successful'
  });

  // Set secure HTTP-only cookie
  res.cookies.set('session-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    path: '/',
  });

  return res;
}

export function clearSession(response?: NextResponse): NextResponse {
  const res = response || NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });

  // Clear the session cookie
  res.cookies.delete('session-token');

  return res;
}

export function requireAuth(request: NextRequest): SessionPayload | null {
  return getSessionFromRequest(request);
}

// Middleware helper to check if a route requires authentication
export function isProtectedRoute(pathname: string): boolean {
  const protectedPaths = ['/workbench'];
  return protectedPaths.some(path => pathname.startsWith(path));
}

// Client-side helper to get current user session
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.user || null;
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
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    
    return response.ok;
  } catch (error) {
    console.error('Logout failed:', error);
    return false;
  }
} 