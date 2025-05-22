"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Session } from "@supabase/supabase-js";

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
    return (
        <div>
            <Account />
        </div>
    );
}
