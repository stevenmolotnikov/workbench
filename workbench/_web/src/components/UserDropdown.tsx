"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { User } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { logout, getCurrentUser, UserSession } from "@/lib/session"
import { Button } from "./ui/button"
import { Switch } from "./ui/switch"
import { useWorkspace } from "@/stores/useWorkspace"

export function UserDropdown() {
    const router = useRouter();
    const { userMode, setUserMode } = useWorkspace();
    const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <User size={14} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <div className="flex flex-col border-b py-1.5 px-1">   
                    <span className="px-1 text-sm font-semibold">Account</span>
                    <span className="px-1 text-sm">{currentUser?.email}</span>
                </div>
                <div className="flex flex-col border-b py-1.5 px-1">   
                    <span className="px-1 text-sm font-semibold">User Mode</span>
                    <Switch
                        checked={userMode === "learn"}
                        onCheckedChange={() => setUserMode(userMode === "learn" ? "experiment" : "learn")}
                    />
                    <span className="px-1 text-sm">{userMode === "learn" ? "Learn" : "Experiment"}</span>
                </div>
                <DropdownMenuItem disabled={isLoggingOut} onClick={handleLogout}>
                    Logout
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
    )
}
