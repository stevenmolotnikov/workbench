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
import { LayoutGrid, Minus, Plus } from "lucide-react";
import { useCharts } from "@/stores/useCharts";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { StatusUpdatesDisplay } from "./StatusUpdatesDisplay";
import { useAnnotations } from "@/stores/useAnnotations";
import { TutorialsToggle } from "./TutorialsToggle";
import { WorkspaceSettingsPopover } from "./WorkspaceSettingsPopover";
import { getCurrentUser, logout } from "@/lib/session";

interface WorkbenchModeProps {
    tutorialsOpen: boolean;
    workbenchMode: "lens" | "patch";
    setWorkbenchMode: (mode: "lens" | "patch") => void;
    toggleTutorials: () => void;
    sidebarCollapsed?: boolean;
    toggleSidebar?: () => void;
    workspaceId?: string;
}

export function WorkbenchMenu({ 
    tutorialsOpen, 
    workbenchMode,
    setWorkbenchMode,
    toggleTutorials, 
    sidebarCollapsed = false, 
    toggleSidebar,
    workspaceId
}: WorkbenchModeProps) {
    const { layout, setLayout, clearGridPositions  } = useCharts();
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
        clearGridPositions();
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
                { toggleSidebar && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleSidebar}
                        className="h-8 w-8"
                    >
                        <PanelLeft className="h-4 w-4" />
                    </Button>
                )}
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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                            <LayoutGrid size={16} />
                            Charts per row: {layout}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setLayout(1)}>1 per row</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLayout(2)}>2 per row</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLayout(3)}>3 per row</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <TutorialsToggle tutorialsOpen={tutorialsOpen} toggleTutorials={toggleTutorials} />
                
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
