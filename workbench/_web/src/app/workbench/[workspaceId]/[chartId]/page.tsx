"use client";

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";

import ChartCardsSidebar from "../components/ChartCardsSidebar";
import LensArea from "./components/lens/LensArea";
import PerplexArea from "./components/perplex/PerplexArea";
import { ChartDisplay } from "@/components/charts/ChartDisplay";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getConfigForChart } from "@/lib/queries/chartQueries";
import { queryKeys } from "@/lib/queryKeys";

export default function ChartPage() {
    const { chartId } = useParams<{ chartId: string }>();

    const { data: config } = useQuery({
        queryKey: queryKeys.charts.config(chartId),
        queryFn: () => getConfigForChart(chartId),
        enabled: !!chartId,
    });

    // Determine which area to show based on config type
    const renderArea = () => {
        if (!config) {
            return <LensArea />; // Default fallback
        }
        
        switch (config.type) {
            case "perplex":
                return <PerplexArea />;
            case "lens":
            default:
                return <LensArea />;
        }
    };

    return (
        <div className="size-full flex min-h-0">
            <ChartCardsSidebar />
            <div className="flex-1 min-h-0 pb-3 pr-3">
                <ResizablePanelGroup
                    direction="horizontal"
                    className="flex size-full rounded dark:bg-secondary/50 bg-secondary/80 border"
                >
                    <ResizablePanel className="h-full" defaultSize={30} minSize={25}>
                        {renderArea()}
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