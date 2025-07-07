"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { getCurrentUser, logout } from "@/lib/session";

export function WorkspaceHeader() {
    const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string | null } | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function fetchCurrentUser() {
            try {
                const user = await getCurrentUser();
                setCurrentUser(user);
            } catch (error) {
                console.error("Failed to get current user:", error);
            }
        }
        
        fetchCurrentUser();
    }, []);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const success = await logout();
            if (success) {
                // Redirect to login page
                router.push('/login');
            } else {
                console.error("Logout failed");
            }
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Workspaces</h1>
            <div className="flex items-center gap-4">
                {currentUser && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User size={14} />
                        <span>{currentUser.name || currentUser.email}</span>
                    </div>
                )}
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                >
                    <LogOut size={16} />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                </Button>
            </div>
        </div>
    );
} 