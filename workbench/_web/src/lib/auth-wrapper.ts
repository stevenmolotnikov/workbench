"use server";

import { auth } from "@/auth";
import { users } from "../db/schema";

export type User = typeof users.$inferSelect;

export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return null;
    }
    
    // Auth.js already provides the user info from the session
    // We can construct a User object from the session data
    const user: User = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      emailVerified: null,
      image: session.user.image,
    };
    
    return user;
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return null;
  }
}

type AuthenticatedFunction<T extends unknown[], R> = (user: User, ...args: T) => Promise<R>;

export async function withAuth<T extends unknown[], R>(
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
export async function withApiAuth<T extends unknown[], R>(
  fn: AuthenticatedFunction<T, R>
) {
  return withAuth(fn);
}