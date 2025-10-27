import { useWorkspace } from "@/stores/useWorkspace";
import { getChartById, getConfigForChart } from "@/lib/queries/chartQueries";
import { useIsMutating, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { HeatmapCard } from "./heatmap/HeatmapCard";
import { LineCard } from "./line/LineCard";
import { PerplexDisplay } from "./perplex/PerplexDisplay";
import { HeatmapChart, LineChart, PerplexChart, PerplexConfig } from "@/db/schema";
import { useCapture } from "@/components/providers/CaptureProvider";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";

// Track mutation state globally via keys set in chartApi hooks

export function ChartDisplay() {
    const { jobStatus } = useWorkspace();
    const { chartId } = useParams<{ chartId: string }>();
    const { captureRef } = useCapture();

    const isLineRunning = useIsMutating({ mutationKey: ["lensLine"] }) > 0;
    const isHeatmapRunning = useIsMutating({ mutationKey: ["lensGrid"] }) > 0;

    const { data: chart, isLoading } = useQuery({
        queryKey: queryKeys.charts.chart(chartId),
        queryFn: () => getChartById(chartId as string),
        enabled: !!chartId,
    });

    const { data: config } = useQuery({
        queryKey: queryKeys.charts.config(chartId),
        queryFn: () => getConfigForChart(chartId),
        enabled: !!chartId,
    });

    // Some query is running
    const isPending = isLineRunning || isHeatmapRunning;

    // Has no data or is loading from db
    const showEmptyState = (jobStatus === "Idle" && (chart && chart.data === null)) || isLoading || !chart || !chart.data;

    // Determine data type - check perplex first since it's an object, not an array
    const isPerplexData = chart?.data && typeof chart.data === 'object' && 'prompt_tokens' in chart.data;
    const isHeatmapData = !isPerplexData && Array.isArray(chart?.data) && chart.data.some((row: any) => row.data?.some((cell: any) =>  "label" in cell));

    return (
        <div className={cn("flex size-full", 
            showEmptyState && "pb-6"
        )}>
            {showEmptyState ? (
                <div className="flex size-full items-center justify-center border mx-3 mt-3 border-dashed rounded">
                    <div className="text-muted-foreground">No chart data</div>
                </div>
            ) : isPerplexData || chart.type === "perplex" ? (
                <PerplexDisplay 
                    results={(chart as PerplexChart).data}
                    captureRef={captureRef}
                    prompt={(config as PerplexConfig)?.data?.prompt || ""}
                    output={(config as PerplexConfig)?.data?.output || ""}
                    model={(config as PerplexConfig)?.data?.model || ""}
                />
            ) : isHeatmapRunning || (!isPending && chart.type === "heatmap") ? (
                <HeatmapCard captureRef={captureRef} chart={chart as HeatmapChart} pending={isPending || !isHeatmapData} />
            ) :  (
                <LineCard captureRef={captureRef} chart={chart as LineChart} pending={isPending || isHeatmapData} />
            )}
        </div>
    );
}