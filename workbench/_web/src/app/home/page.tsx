"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

// Simple user interface for the new auth system
interface User {
  id: string;
  email: string;
  name?: string;
}

function Account() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // For now, we'll just show a simple message
        // In a real implementation, you'd get the user from your auth context/session
        setUser({ id: "1", email: "user@example.com", name: "User" });
        setLoading(false);
    }, []);

    if (loading) {
        return <div className="text-center">Loading...</div>;
    }

    return <div className="text-xl font-semibold">Hello {user?.name || "there"}!</div>;
}

export default function HomePage() {
    const router = useRouter();
    
    function logOut() {
        // Simple logout - redirect to login
        console.log("Logging out");
        router.push("/login");
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Card className="w-full max-w-md mx-auto flex flex-col items-center">
                <CardHeader className="flex flex-col items-center">
                    <CardTitle className="text-2xl mb-2">Welcome!</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <Account />
                </CardContent>
                <CardFooter className="flex flex-col gap-2 w-full">
                    <Button onClick={logOut} variant="outline" className="w-full">Log Out</Button>
                    <Link href="/workbench" className="w-full">
                        <Button className="w-full">Workbench</Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
