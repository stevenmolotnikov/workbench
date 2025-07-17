import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { SquarePen, FileText, PanelLeft, LogOut, User } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Minus, Plus } from "lucide-react";
import { useWorkspace } from "@/stores/useWorkspace";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { StatusUpdatesDisplay } from "./StatusUpdatesDisplay";
import { useAnnotations } from "@/stores/useAnnotations";
// import { TutorialsToggle } from "./TutorialsToggle";
import { WorkspaceSettingsPopover } from "./WorkspaceSettingsPopover";
import { getCurrentUser, logout } from "@/lib/session";

interface WorkbenchModeProps {
    tutorialsOpen: boolean;
    workbenchMode: "lens" | "patch";
    setWorkbenchMode: (mode: "lens" | "patch") => void;
    toggleTutorials: () => void;
    workspaceId?: string;
}

export function WorkbenchMenu({ 
    tutorialsOpen, 
    workbenchMode,
    setWorkbenchMode,
    toggleTutorials, 
    workspaceId
}: WorkbenchModeProps) {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string | null } | null>(null);
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

    const handleValueChange = (value: "lens" | "patch") => {
        setWorkbenchMode(value);
    };

    const toggleAnnotations = () => {
        const { isOpen } = useAnnotations.getState();
        useAnnotations.setState({ isOpen: !isOpen });
    };

    const handleExport = () => {
        router.push('/workbench/summaries');
    };

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
        <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Select value={workbenchMode} onValueChange={handleValueChange}>
                    <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="lens">Lens</SelectItem>
                        <SelectItem value="patch">Patch</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <StatusUpdatesDisplay />
                {workspaceId && <WorkspaceSettingsPopover workspaceId={workspaceId} />}
                <Button variant="outline" size="sm" onClick={handleExport}>
                    <FileText size={16} />
                    Export
                </Button>
                <Button variant="outline" size="sm" onClick={toggleAnnotations}>
                    <SquarePen size={16} />
                    Annotate
                </Button>
                {/* <TutorialsToggle tutorialsOpen={tutorialsOpen} toggleTutorials={toggleTutorials} /> */}
                
                {/* User info and logout */}
                <div className="flex items-center gap-2 ml-4 pl-4 border-l">
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
        </div>
    );
}
