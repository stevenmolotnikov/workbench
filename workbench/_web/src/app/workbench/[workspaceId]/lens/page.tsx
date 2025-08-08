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
import { getOrCreateLensConfig } from "@/lib/queries/chartQueries";
import { useQuery } from "@tanstack/react-query";
import useModels from "@/hooks/useModels";
import { LensConfigData } from "@/types/lens";
import { AnnotationsDisplay } from "../components/AnnotationsDisplay";
import { ToolTabs } from "../components/ToolTabs";

export default function Workbench({ params }: { params: Promise<{ workspaceId: string }> }) {
    const resolvedParams = use(params);

    const { selectedModel, annotationsOpen } = useWorkspace();

    // Execute the hook to make sure a selected model is set
    useModels();

    const defaultConfig: LensConfigData = {
        prompt: "",
        model: selectedModel?.name || "",
        token: { idx: 0, id: 0, text: "", targetIds: [] },
    }

    const { data: chartConfig, isSuccess: isChartConfigSuccess } = useQuery({
        queryKey: ["chartConfig", resolvedParams.workspaceId],
        queryFn: () => getOrCreateLensConfig(resolvedParams.workspaceId, defaultConfig),
        enabled: !!selectedModel,
    });

    return (
        <div className="flex flex-1 min-h-0">
            {/* Main content */}
            <ResizablePanelGroup
                direction="horizontal"
                className="flex flex-1 min-h-0 h-full"
            >
                <ResizablePanel className="h-full" defaultSize={annotationsOpen ? 35 : 40} minSize={25}>
                    <ToolTabs />
                    {isChartConfigSuccess &&
                        <InteractiveDisplay initialConfig={chartConfig} />
                    }
                </ResizablePanel>
                <ResizableHandle className="w-[0.8px]" />
                <ResizablePanel defaultSize={annotationsOpen ? 45 : 60} minSize={35}>
                    <ChartDisplay />
                </ResizablePanel>
                {annotationsOpen && (
                    <>
                        <ResizableHandle className="w-[0.8px]" />
                        <ResizablePanel defaultSize={20} minSize={15}>
                            <AnnotationsDisplay />
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>
        </div>
    );
}
