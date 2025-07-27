import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Annotations } from "@/components/charts/Annotations";
import { useAnnotations } from "@/stores/useAnnotations";
import { ScrollArea } from "./ui/scroll-area";

interface ResizableLayoutProps {
    workbench: React.ReactNode;
    charts: React.ReactNode;
}

export function ResizableLayout({ workbench, charts }: ResizableLayoutProps) {    
    const { isOpen: annotationsOpen } = useAnnotations();

    return (
        <ResizablePanelGroup
            direction="horizontal"
            className="flex flex-1 min-h-0 h-full"
        >
            <ResizablePanel className="h-full" defaultSize={35} minSize={30}>
                <ScrollArea className="h-full">
                    {workbench}
                </ScrollArea>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={50} minSize={40} maxSize={65}>
                {charts}
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
