import { LineGraph } from "@/components/charts/primatives/LineGraph";
import type { Chart } from "@/types/charts";
import type { LineGraphData } from "@/types/charts";

interface LineChartWrapperProps {
    chart: Chart;
}

export function LineChartWrapper({ chart }: LineChartWrapperProps) {
    if (!chart.chartData) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No data available</p>
            </div>
        );
    }

    const lineData = chart.chartData as LineGraphData;

    return (
        <div className="pt-6 h-full">
            <LineGraph chartIndex={chart.position} data={lineData} />
        </div>
    );
}