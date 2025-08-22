"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";

import ChartCardsSidebar from "../components/ChartCardsSidebar";
import LensArea from "./components/lens/LensArea";
import SimplePatchArea from "./components/patch/SimplePatchArea";
import { ChartDisplay } from "@/components/charts/ChartDisplay";
import { getConfigForChart } from "@/lib/queries/chartQueries";
import { Loader2 } from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";

export default function ChartPage() {
    const { chartId } = useParams<{ workspaceId: string; chartId: string }>();

    // TODO(cadentj): FIX THE INSTANCES WHERE CONFIGS ARE CALLED BY CHART ID
    const { data: config, isLoading: isConfigLoading } = useQuery({
        queryKey: queryKeys.charts.config(chartId),
        queryFn: () => getConfigForChart(chartId),
        enabled: !!chartId,
    });

    const isLens = config?.type === "lens";

    return (
        <div className="size-full flex min-h-0">
            <ChartCardsSidebar />
            <div className="flex-1 min-h-0 pb-3 pr-3">
                <ResizablePanelGroup
                    direction="horizontal"
                    className="flex size-full rounded bg-secondary/50 border"
                >
                    <ResizablePanel className="h-full" defaultSize={30} minSize={25}>
                        {
                            isConfigLoading ?
                                <div className="flex flex-1 items-center p-4 justify-center">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </div> :
                                isLens ? <LensArea /> : <SimplePatchArea />
                        }
                    </ResizablePanel>
                    <ResizableHandle className="w-[0.8px]" />
                    <ResizablePanel defaultSize={50} minSize={30}>
                        <ChartDisplay />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
}