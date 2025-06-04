import * as React from "react";
import { useRouter, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { SquarePen } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutGrid } from "lucide-react";
import { BookOpen } from "lucide-react";
import { useCharts } from "@/stores/useCharts";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface WorkbenchModeProps {
    toggleAnnotations: () => void;
    toggleTutorials: () => void;
}

export function WorkbenchMenu({ toggleAnnotations, toggleTutorials }: WorkbenchModeProps) {
    const { setLayout } = useCharts();
    const router = useRouter();
    const pathname = usePathname();

    const handleValueChange = (value: string) => {
        router.push(`/workbench/${value}`);
    };

    return (
        <div className="p-4 border-b flex items-center justify-between">
            <Select  value={pathname.split("/").pop()} onValueChange={handleValueChange}>
                <SelectTrigger className="max-w-48 h-8">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="lens">Lens</SelectItem>
                    <SelectItem value="patch">Patch</SelectItem>
                </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={toggleAnnotations}>
                    <SquarePen size={16} />
                    Annotate
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                            <LayoutGrid size={16} />
                            Layout
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setLayout("1x1")}>1x1</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLayout("2x1")}>2x1</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLayout("2x2")}>2x2</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" className="h-8 text-xs" onClick={toggleTutorials}>
                    <BookOpen size={16} />
                    Tutorials
                </Button>
            </div>
        </div>
    );
}
