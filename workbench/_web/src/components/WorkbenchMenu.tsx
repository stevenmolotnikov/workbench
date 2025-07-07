import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { SquarePen, FileText, PanelLeft } from "lucide-react";
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
            </div>
        </div>
    );
}
