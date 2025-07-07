import { NextRequest } from "next/server";
import { clearSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    // Clear the session cookie and return success response
    return clearSession();
  } catch (error: unknown) {
    console.error("Logout error:", error);
    
    // Even if there's an error, we still want to clear the cookie
    return clearSession();
  }
} 