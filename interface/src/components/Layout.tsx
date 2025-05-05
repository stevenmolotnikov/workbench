import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface ResizableLayoutProps {
    workbench: React.ReactNode;
    charts: React.ReactNode;
    annotations: React.ReactNode;
}

export function ResizableLayout({ workbench, charts, annotations }: ResizableLayoutProps) {
    const [annotationsOpen, setAnnotationsOpen] = useState(true);
    
    const toggleAnnotations = () => {
        setAnnotationsOpen(!annotationsOpen);
    }
    
    return (
        <ResizablePanelGroup
            direction="horizontal"
            className="flex flex-1 min-h-0 h-full"
        >
            <ResizablePanel defaultSize={35} minSize={30}>
                {workbench}
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={50} minSize={35} maxSize={65}>
                {charts}
            </ResizablePanel>
            {annotationsOpen && (
                <>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={15} maxSize={30} minSize={15}>
                        <div className="relative h-full">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 z-10"
                                onClick={toggleAnnotations}
                            >
                                <EyeOff className="h-4 w-4" />
                            </Button>
                            {annotations}
                        </div>
                    </ResizablePanel>
                </>
            )}
            {!annotationsOpen && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-2 right-2 z-10"
                    onClick={toggleAnnotations}
                >
                    <Eye className="h-4 w-4" />
                </Button>
            )}
        </ResizablePanelGroup>
    )
}
