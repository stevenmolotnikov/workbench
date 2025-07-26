import { Heatmap } from "@/components/charts/primatives/Heatmap";
import type { ChartData } from "@/types/charts";
import type { HeatmapData } from "@/types/charts";

interface HeatmapChartWrapperProps {
    chart: ChartData;
}

export function HeatmapChartWrapper({ chart }: HeatmapChartWrapperProps) {
    if (!chart) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No data available</p>
            </div>
        );
    }

    const heatmapData = chart as HeatmapData;

    return (
        <Heatmap chartIndex={0} {...heatmapData} />
    );
}