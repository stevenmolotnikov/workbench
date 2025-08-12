"use client";

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";

import ChartCardsSidebar from "../../components/ChartCardsSidebar";
import { ChartDisplay } from "@/components/charts/ChartDisplay";
import { Editor } from "./components/Editor";
import { AnnotationsDisplay } from "./components/AnnotationsDisplay";

export default function OverviewPage() {

    return (
        <div className="flex flex-1 min-h-0">
            <ResizablePanelGroup
                direction="horizontal"
                className="flex flex-1 min-h-0 h-full"
            >
                <ResizablePanel className="h-full" defaultSize={10} minSize={15}>
                    <ChartCardsSidebar />
                </ResizablePanel>
                <ResizableHandle className="w-[0.8px]" />
                <ResizablePanel className="h-full" defaultSize={45} minSize={25}>
                    <Editor />
                </ResizablePanel>
                <ResizableHandle className="w-[0.8px]" />
                <ResizablePanel defaultSize={45} minSize={30}>
                    <AnnotationsDisplay />
                    {/* <ChartDisplay /> */}
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}