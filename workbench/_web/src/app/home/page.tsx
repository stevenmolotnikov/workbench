"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

function Account() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();
        
        // Get session on initial load
        async function getSession() {
            const { data: { session } } = await supabase.auth.getSession();
            console.log(session);
            setSession(session);
            setLoading(false);
        }
        
        getSession();
        
        // Set up auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
            }
        );
        
        // Cleanup subscription on unmount
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    if (loading) {
        return <div className="text-center">Loading...</div>;
    }

    return <div className="text-xl font-semibold">Hello {session?.user.user_metadata.name || "there"}!</div>;
}

export default function HomePage() {
    const router = useRouter();
    
    async function logOut() {
        const supabase = createClient();
        console.log("Logging out");
        await supabase.auth.signOut();
        router.push("/auth/login");
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
                    <Link href="/workbench/lens" className="w-full">
                        <Button className="w-full">Workbench</Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
