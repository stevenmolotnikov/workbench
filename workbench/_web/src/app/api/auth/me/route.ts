import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }
    
    // Return user information (excluding sensitive fields like iat, exp)
    const user = {
      id: session.id,
      email: session.email,
      name: session.name,
    };
    
    return NextResponse.json({
      success: true,
      user,
    });
    
  } catch (error: unknown) {
    console.error("Get current user error:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
} 