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
import { BorderBeam } from "../magicui/border-beam";
import { HeatmapChart, LineChart } from "@/db/schema";
import { useCapture } from "@/components/providers/CaptureProvider";

export function ChartDisplay() {
    const { jobStatus } = useWorkspace();
    const { chartId } = useParams<{ chartId: string }>();

    const { captureRef, handleCopyPng } = useCapture();

    // Fetch the single chart by id
    const { data: chart, isLoading } = useQuery({
        queryKey: ["chartById", chartId],
        queryFn: () => getChartById(chartId as string),
        enabled: !!chartId,
    });

    const onCopyPng = useCallback(async () => {
        await handleCopyPng();
    }, [handleCopyPng]);


    if (!chart) {
        return <div>No chart found</div>;
    }

    if (isLoading) return (
        <div className="flex-1 flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );

    return (
        <div className="flex-1 flex h-full flex-col overflow-hidden custom-scrollbar relative">
            <div className="px-2 py-2 flex items-center bg-background justify-end h-12 border-b">
                <div className="flex items-center gap-2">
                    <CodeExport chartId={chart?.id} chartType={chart?.type as ("line"|"heatmap"|null|undefined)} />
                    <Button variant="outline" size="sm" onClick={onCopyPng}><Copy className="h-4 w-4" /> Copy</Button>
                </div>
            </div>

            {chart && chart.type === "heatmap" && (chart.data !== null) ? (
                <HeatmapCard captureRef={captureRef} chart={chart as HeatmapChart} />
            ) : chart && chart.data !== null ? (
                <LineCard captureRef={captureRef} chart={chart as LineChart} />
            ) : (
                <div className="flex-1 flex h-full items-center relative justify-center border m-2 border-dashed rounded">
                    {jobStatus !== "idle" && <BorderBeam duration={5}
                        size={300}
                        className="from-transparent bg-primary to-transparent" />}
                    <div className="text-muted-foreground">No chart data</div>
                </div>
            )}
        </div>
    );
}