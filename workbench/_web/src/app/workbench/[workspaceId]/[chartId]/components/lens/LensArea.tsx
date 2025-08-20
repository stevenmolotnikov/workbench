import { ModelSelector } from "@/components/ModelSelector";
import { CompletionCard } from "./CompletionCard";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getChartById, getConfigForChart } from "@/lib/queries/chartQueries";
import { LensConfig } from "@/db/schema";
import { queryKeys } from "@/lib/queryKeys";
import { ChartType } from "@/types/charts";

export default function LensArea() {
    const { chartId } = useParams<{ chartId: string }>();

    const { data: config } = useQuery({
        queryKey: queryKeys.charts.config(chartId),
        queryFn: () => getConfigForChart(chartId),
        enabled: !!chartId,
    });

    const { data: chart } = useQuery({
        queryKey: queryKeys.charts.chart(chartId),
        queryFn: () => getChartById(chartId as string),
        enabled: !!chartId,
    });

    if (!config) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                Loading config…
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="px-2 py-2 border-b h-12 flex items-center justify-between">
                <h2 className="text-sm pl-2 font-medium">Model</h2>
                <ModelSelector />
            </div>

            <div className="p-2">
                {/* Assume lens config here; unified page will gate by config.type */}
                <CompletionCard initialConfig={config as LensConfig} chartType={chart?.type as ChartType} />
            </div>
        </div>
    );
}