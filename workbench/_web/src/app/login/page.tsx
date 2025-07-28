"use client";

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { Github } from "lucide-react";
import { signIn } from "next-auth/react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Get redirect URL from query params
    const callbackUrl = searchParams.get('redirect') || '/workbench';

    const handleGitHubSignIn = async () => {
        setLoading(true);
        setError("");

        try {
            await signIn("github", {
                callbackUrl,
            });
        } catch (error) {
            console.error("Sign in error:", error);
            setError("Failed to sign in. Please try again.");
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle>Welcome to Interp Workbench</CardTitle>
                <CardDescription>
                    Sign in with your GitHub account to continue
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}
                    
                    <Button 
                        onClick={handleGitHubSignIn} 
                        className="w-full" 
                        disabled={loading}
                    >
                        {loading ? (
                            "Signing in..."
                        ) : (
                            <>
                                <Github className="mr-2 h-4 w-4" />
                                Sign in with GitHub
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <img
                    src="/images/NDIF.png"
                    alt="NDIF Logo"
                    className="h-20 self-center font-medium"
                />
                
                <Suspense fallback={
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-center">Loading...</div>
                        </CardContent>
                    </Card>
                }>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
}