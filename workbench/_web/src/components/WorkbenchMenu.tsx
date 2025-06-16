import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { SquarePen } from "lucide-react";
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

interface WorkbenchModeProps {
    tutorialsOpen: boolean;
    toggleTutorials: () => void;
}

export function WorkbenchMenu({ tutorialsOpen, toggleTutorials }: WorkbenchModeProps) {
    const { layout, setLayout } = useCharts();
    const router = useRouter();
    const pathname = usePathname();

    const handleValueChange = (value: string) => {
        router.push(`/workbench/${value}`);
    };

    const toggleAnnotations = () => {
        const { isOpen } = useAnnotations.getState();
        useAnnotations.setState({ isOpen: !isOpen });
    };

    const adjustChartsPerRow = (adjustment: number) => {
        const newLayout = Math.max(1, Math.min(6, layout + adjustment)); // Min 1, Max 6 charts per row
        setLayout(newLayout);
    };

    return (
        <div className="p-4 border-b flex items-center justify-between">
            <Select value={pathname.split("/").pop()} onValueChange={handleValueChange}>
                <SelectTrigger className="max-w-48 h-8">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="lens">Lens</SelectItem>
                    <SelectItem value="patch">Patch</SelectItem>
                </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
                <StatusUpdatesDisplay />
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
                        <div className="flex items-center gap-2 p-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => adjustChartsPerRow(-1)}
                                disabled={layout <= 1}
                                className="h-6 w-6 p-0"
                            >
                                <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{layout}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => adjustChartsPerRow(1)}
                                disabled={layout >= 6}
                                className="h-6 w-6 p-0"
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="border-t pt-1">
                            <DropdownMenuItem onClick={() => setLayout(1)}>1 per row</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLayout(2)}>2 per row</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLayout(3)}>3 per row</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLayout(4)}>4 per row</DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
                <TutorialsToggle 
                    tutorialsOpen={tutorialsOpen} 
                    toggleTutorials={toggleTutorials} 
                />
            </div>
        </div>
    );
}
