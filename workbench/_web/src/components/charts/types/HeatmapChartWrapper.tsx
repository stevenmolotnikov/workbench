import { Heatmap } from "@/components/charts/primatives/Heatmap";
import type { Chart } from "@/types/charts";
import type { HeatmapData } from "@/types/charts";

interface HeatmapChartWrapperProps {
    chart: Chart;
}

export function HeatmapChartWrapper({ chart }: HeatmapChartWrapperProps) {
    if (!chart.chartData) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No data available</p>
            </div>
        );
    }

    const heatmapData = chart.chartData as HeatmapData;

    return (
        <Heatmap chartIndex={chart.position} {...heatmapData} />
    );
}