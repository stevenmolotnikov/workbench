import { NextRequest, NextResponse } from "next/server";
import { createAccount } from "@/lib/api";
import { z } from "zod";

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
    
    // Create account
    const result = await createAccount(
      validatedData.email,
      validatedData.password,
      validatedData.name
    );
    
    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: result.user,
      },
      { status: 201 }
    );
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
    
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        return NextResponse.json(
          {
            success: false,
            message: "User already exists with this email",
          },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
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