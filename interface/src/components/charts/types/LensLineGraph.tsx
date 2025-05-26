import { useState } from "react";
import { LineGraph } from "@/components/charts/base/LineGraph";
import { useCharts } from "@/stores/useCharts";
import { useLensCompletions } from "@/stores/useLensCompletions";
import { ChartCard } from "../ChartCard";

export function LensLineGraph({ index }: { index: number }) {
    const [isLoading, setIsLoading] = useState(false);

    const { activeCompletions } = useLensCompletions();
    const { gridPositions, removeChart, setChartData } = useCharts();

    const gridPosition = gridPositions[index];

    const handleRunChart = async () => {
        setIsLoading(true);

        try {
            const response = await fetch("/api/lens-line", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    completions: activeCompletions,
                }),
            });

            if (!response.ok) throw new Error(response.statusText);

            const data = await response.json();
            setChartData(index, { type: "lineGraph", data });
        } catch (error) {
            console.error(`Error executing chart at position ${index}:`, error);
            setChartData(index, null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfigChart = () => {
        console.log(`Configuring chart at position ${index}`);
    };

    return (
        <ChartCard
            handleRunChart={handleRunChart}
            handleRemoveChart={() => removeChart(index)}
            isLoading={isLoading}
            chart={gridPosition.chartData ? (
                <LineGraph data={gridPosition.chartData.data} />
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data</p>
                </div>
            )}
        />
    );
}
