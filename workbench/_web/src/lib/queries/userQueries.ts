import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  return user || null;
}

export async function getUserById(id: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  
  return user || null;
}

export async function createUser(email: string, password: string, name?: string | null) {
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      password,
      name: name || null,
    })
    .returning();
  
  return newUser;
}