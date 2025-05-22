"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
    const signInWithGithub = async () => {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <a href="#" className="flex items-center gap-2 self-center font-medium">
                    {/* <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        Icon
                    </div> */}
                    <img src="/images/NDIF.png" alt="NDIF Logo" className="h-12" />
                </a>
                <div className={cn("flex flex-col gap-6", className)} {...props}>
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-xl">Welcome back</CardTitle>
                            <CardDescription>
                                Login with your Github account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form>
                                <div className="grid gap-6">
                                    <div className="flex flex-col gap-4">
                                        <Button
                                            variant="outline"
                                            onClick={signInWithGithub}
                                            className="w-full"
                                        >
                                            <Github className="size-8" />
                                            Login with Github
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
