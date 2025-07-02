"use client";
 
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Github, TreePine } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
    const router = useRouter();

    const signInWithGithub = async () => {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        
        if (error) {
            console.error("Error signing in with GitHub:", error);
            // You might want to show an error toast here
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                router.push("/home");
            }
        };
        checkAuth();
    }, []);

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <img
                    src="/images/NDIF.png"
                    alt="NDIF Logo"
                    className="h-20 self-center font-medium"
                />
                <div className="flex flex-col gap-3 border p-5 bg-muted rounded-lg">
                    <Button variant="outline" onClick={signInWithGithub} className="w-full">
                        <Github className="size-8" />
                        Login with Github
                    </Button>
                    <Button
                        variant="outline"
                        disabled
                        onClick={signInWithGithub}
                        className="w-full"
                    >
                        <TreePine className="size-8" />
                        Login with ORCID
                    </Button>
                </div>
            </div>
        </div>
    );
}
