import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createUser } from "@/lib/queries/userQueries";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSessionResponse } from "@/lib/session";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await getUserByEmail(validatedData.email);
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User already exists with this email",
        },
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    // Create user
    const newUser = await createUser(
      validatedData.email,
      hashedPassword,
      validatedData.name
    );
    
    // Create session with JWT token and secure cookies
    const userSession = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    };
    
    return createSessionResponse(userSession);
    
  } catch (error: unknown) {
    console.error("Registration error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input data",
          errors: error.errors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}