import { useWorkspace } from "@/stores/useWorkspace";
import { Copy, Loader2 } from "lucide-react";
import { getChartById } from "@/lib/queries/chartQueries";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useCallback } from "react";

import { HeatmapCard } from "./heatmap/HeatmapCard";
import { LineCard } from "./line/LineCard";
import CodeExport from "@/app/workbench/[workspaceId]/components/CodeExport";
import { Button } from "../ui/button";
import { HeatmapChart, LineChart } from "@/db/schema";
import { useCapture } from "@/components/providers/CaptureProvider";
import { queryKeys } from "@/lib/queryKeys";

export function ChartDisplay() {
    const { jobStatus, currentChartType } = useWorkspace();
    const { chartId } = useParams<{ chartId: string }>();
    const { captureRef, handleCopyPng } = useCapture();

    const { data: chart, isLoading } = useQuery({
        queryKey: queryKeys.charts.chart(chartId),
        queryFn: () => getChartById(chartId as string),
        enabled: !!chartId,
    });

    const onCopyPng = useCallback(async () => {
        await handleCopyPng();
    }, [handleCopyPng]);

    if (!chart) {
        return <div>Error: No chart found</div>;
    }

    // Determine UI state
    const hasNoData = jobStatus === "idle" && chart.data === null;
    const isPending = jobStatus !== "idle" || currentChartType !== chart.type;
    const showEmptyState = hasNoData || isLoading;

    return (
        <div className="flex-1 flex h-full flex-col overflow-hidden custom-scrollbar relative">
            <div className="px-2 py-2 flex items-center bg-background justify-end h-12 border-b">
                <div className="flex items-center gap-2">
                    <CodeExport chartId={chart?.id} chartType={chart?.type as ("line" | "heatmap" | null | undefined)} />
                    <Button variant="outline" size="sm" onClick={onCopyPng}><Copy className="h-4 w-4" /> Copy</Button>
                </div>
            </div>

            {showEmptyState ? (
                <div className="flex-1 flex h-full items-center relative justify-center border m-2 border-dashed rounded">
                    <div className="text-muted-foreground">No chart data</div>
                </div>
            ) : currentChartType === "heatmap" ? (
                <HeatmapCard captureRef={captureRef} chart={chart as HeatmapChart} pending={isPending} />
            ) : (
                <LineCard captureRef={captureRef} chart={chart as LineChart} pending={isPending} />
            )}
        </div>
    );
}