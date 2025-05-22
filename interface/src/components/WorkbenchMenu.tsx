import * as React from "react";

import { Button } from "@/components/ui/button";
import { Play, MessageSquareText } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutGrid } from "lucide-react";
import { Layout } from "@/types/workspace";

interface WorkbenchModeProps {
    setLayout: (layout: Layout) => void;
    handleRun: () => void;
    toggleAnnotations: () => void;
}

export function WorkbenchMenu({ toggleAnnotations, setLayout, handleRun }: WorkbenchModeProps) {
    return (
        <div className="p-4 border-b flex items-center justify-between">
            <span>Hello</span>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={toggleAnnotations}>
                    <MessageSquareText size={16} />
                    Annotations
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
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" onClick={handleRun}>
                    <Play size={16} />
                    Run
                </Button>
            </div>
        </div>
    );
}
