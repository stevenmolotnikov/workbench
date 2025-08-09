"use client";

import { use } from "react";
import InteractiveDisplay from "./components/InteractiveDisplay";

import { ChartDisplay } from "@/components/charts/ChartDisplay";

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

import { useWorkspace } from "@/stores/useWorkspace";
import useModels from "@/hooks/useModels";
import { AnnotationsDisplay } from "../components/AnnotationsDisplay";
import { ToolTabs } from "../components/ToolTabs";
import ChartCardsSidebar from "./components/ChartCardsSidebar";

export default function Workbench() {
    const { annotationsOpen } = useWorkspace();

    // Ensure a selected model exists
    useModels();

    return (
        <div className="flex flex-1 min-h-0">
            {/* Main content */}
            <ResizablePanelGroup
                direction="horizontal"
                className="flex flex-1 min-h-0 h-full"
            >
                <ResizablePanel className="h-full" defaultSize={20} minSize={15}>
                    <ChartCardsSidebar />
                </ResizablePanel>
                <ResizableHandle className="w-[0.8px]" />
                <ResizablePanel className="h-full" defaultSize={annotationsOpen ? 30 : 35} minSize={25}>
                    <ToolTabs />
                    <InteractiveDisplay />
                </ResizablePanel>
                <ResizableHandle className="w-[0.8px]" />
                <ResizablePanel defaultSize={annotationsOpen ? 40 : 45} minSize={30}>
                    <ChartDisplay />
                </ResizablePanel>
                {annotationsOpen && (
                    <>
                        <ResizableHandle className="w-[0.8px]" />
                        <ResizablePanel defaultSize={10} minSize={15}>
                            <AnnotationsDisplay />
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>
        </div>
    );
}
