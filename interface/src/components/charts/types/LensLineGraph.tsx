import { useState } from "react";
import { LineGraph } from "@/components/charts/base/LineGraph";
import { useCharts } from "@/stores/useCharts";
import { useLensCompletions } from "@/stores/useLensCompletions";
import { ChartCard } from "../ChartCard";
import { useAnnotations } from "@/stores/useAnnotations";

export function LensLineGraph({ index }: { index: number }) {
    const [isLoading, setIsLoading] = useState(false);

    const { activeCompletions } = useLensCompletions();
    const { gridPositions, removeChart, setChartData } = useCharts();
    const { annotations, setAnnotations } = useAnnotations();

    const gridPosition = gridPositions[index];

    const handleRemoveChart = () => {
        setAnnotations(annotations.filter((a) => !(a.type === "lineGraph" && a.data.chartIndex === index)));
        removeChart(index);
    };

    const handleRunChart = async () => {
        setIsLoading(true);

        console.log("activeCompletions", activeCompletions);

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

    return (
        <ChartCard
            handleRunChart={handleRunChart}
            handleRemoveChart={handleRemoveChart}
            isLoading={isLoading}
            chartTitle={
                <div>
                    <div className="text-md font-bold">Lens Line Graph</div>
                    <span className="text-xs text-muted-foreground">Target Token Prediction</span>
                </div>
            }
            chart={gridPosition.chartData ? (
                <div className="pt-6 h-full">
                    <LineGraph chartIndex={index} data={gridPosition.chartData.data} />
                </div>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data</p>
                </div>
            )}
        />
    );
}
