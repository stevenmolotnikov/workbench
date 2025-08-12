"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";

import { useWorkspace } from "@/stores/useWorkspace";
import useModels from "@/hooks/useModels";
import { AnnotationsDisplay } from "../components/AnnotationsDisplay";
import ChartCardsSidebar from "../components/ChartCardsSidebar";
import InteractiveDisplay from "./components/lens/InteractiveDisplay";
import SimplePatchArea from "./components/patch/SimplePatchArea";
import { ChartDisplay } from "@/components/charts/ChartDisplay";
import { getConfigForChart } from "@/lib/queries/chartQueries";
import { ToolTabs } from "../components/ToolTabs";

export default function ChartPage() {
    const { annotationsOpen } = useWorkspace();
    const { chartId } = useParams<{ workspaceId: string; chartId: string }>();

    // Ensure a selected model exists
    useModels();

    const { data: config } = useQuery({
        queryKey: ["chartConfig", chartId],
        queryFn: () => getConfigForChart(chartId),
        enabled: !!chartId,
    });

    const isLens = config?.type === "lens";

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
                <ResizablePanel className="h-full" defaultSize={35} minSize={25}>
                    <ToolTabs />
                    {isLens ? <InteractiveDisplay /> : <SimplePatchArea />}
                </ResizablePanel>
                <ResizableHandle className="w-[0.8px]" />
                <ResizablePanel defaultSize={annotationsOpen ? 40 : 45} minSize={30}>
                    <ChartDisplay />
                </ResizablePanel>
                {annotationsOpen && (
                    <>
                        <ResizableHandle className="w-[0.8px]" />
                        <ResizablePanel defaultSize={15} minSize={15}>
                            <AnnotationsDisplay />
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>
        </div>
    );
}