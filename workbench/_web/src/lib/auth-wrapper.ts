"use server";

import { cookies } from "next/headers";
import { verifyToken } from "./session";
import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export type User = typeof users.$inferSelect;

export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    // Get the session token from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;
    
    if (!sessionToken) {
      return null;
    }
    
    // Verify the token
    const session = verifyToken(sessionToken);
    if (!session) {
      return null;
    }
    
    // Get the user from the database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);
    
    return user || null;
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return null;
  }
}

type AuthenticatedFunction<T extends unknown[], R> = (user: User, ...args: T) => Promise<R>;

export function withAuth<T extends unknown[], R>(
  fn: AuthenticatedFunction<T, R>
) {
  return async (...args: T): Promise<R> => {
    const user = await getAuthenticatedUser();
    if (!user) {
      throw new Error("Authentication required");
    }
    return fn(user, ...args);
  };
}

// Convenience wrapper for API routes
export function withApiAuth<T extends unknown[], R>(
  fn: AuthenticatedFunction<T, R>
) {
  return withAuth(fn);
} 