import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Annotations } from "@/components/charts/Annotations";

interface ResizableLayoutProps {
    workbench: React.ReactNode;
    charts: React.ReactNode;
    annotationsOpen: boolean;
}

export function ResizableLayout({ workbench, charts, annotationsOpen }: ResizableLayoutProps) {    
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
                            <Annotations/>
                        </div>
                    </ResizablePanel>
                </>
            )}
        </ResizablePanelGroup>
    )
}
