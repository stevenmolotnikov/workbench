"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
    });

    // Get redirect URL from query params
    const redirectUrl = searchParams.get('redirect') || '/workbench';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        // Clear error when user starts typing
        if (error) setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
            const body = isLogin 
                ? { email: formData.email, password: formData.password }
                : { email: formData.email, password: formData.password, name: formData.name };

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
                credentials: 'include', // Include cookies in the request
            });

            const data = await response.json();

            if (data.success) {
                // Session is now handled by secure cookies, redirect to intended page
                router.push(redirectUrl);
            } else {
                setError(data.message || "An error occurred");
            }
        } catch (error) {
            console.error("Auth error:", error);
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError("");
        setFormData({ email: "", password: "", name: "" });
    };

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle>{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
                <CardDescription>
                    {isLogin 
                        ? "Sign in to your account to continue" 
                        : "Create a new account to get started"
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium leading-none">Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Enter your name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium leading-none">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="pl-10"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium leading-none">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="pl-10 pr-10"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {!isLogin && (
                            <p className="text-sm text-gray-500">
                                Password must be at least 8 characters long
                            </p>
                        )}
                    </div>
                    
                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
                    </Button>
                </form>
                
                <div className="mt-4 text-center">
                    <Button
                        variant="link"
                        onClick={toggleMode}
                        className="text-sm"
                    >
                        {isLogin 
                            ? "Don't have an account? Create one" 
                            : "Already have an account? Sign in"
                        }
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
