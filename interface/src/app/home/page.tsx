"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

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
        return <div>Loading...</div>;
    }

    return <div>Hello {JSON.stringify(session)}</div>;
}

export default function HomePage() {
    function logOut() {
        const supabase = createClient();
        console.log("Logging out");
        supabase.auth.signOut();
    }

    return (
        <div>
            <Account />
            <Button onClick={logOut}>Log Out</Button>
        </div>
    );
}
