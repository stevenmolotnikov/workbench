import { useState } from "react";
import { Heatmap } from "@/components/charts/base/Heatmap";
import { useCharts } from "@/stores/useCharts";
import { ChartCard } from "../ChartCard";

import { useAnnotations } from "@/stores/useAnnotations";

export function PatchingHeatmap({ index }: { index: number }) {
    const [isLoading, setIsLoading] = useState(false);
    const [completionIndex, setCompletionIndex] = useState<string>("1");

    const { annotations, setAnnotations } = useAnnotations();
    const { gridPositions, removeChart } = useCharts();

    const gridPosition = gridPositions[index];

    const handleRemoveChart = () => {
        setAnnotations(
            annotations.filter((a) => !(a.type === "heatmap" && a.data.chartIndex === index))
        );
        removeChart(index);
    };

    return (
        <div className="h-full w-full">
            <ChartCard
                handleRunChart={() => {
                    console.log("run patching heatmap");
                }}
                handleRemoveChart={handleRemoveChart}
                isLoading={isLoading}
                chartTitle={
                    <div>
                        <div className="text-md font-bold">Lens Heatmap</div>
                        <span className="text-xs text-muted-foreground">
                            Completion {completionIndex}
                        </span>
                    </div>
                }
                chart={
                    gridPosition.chartData ? (
                        <Heatmap chartIndex={index} {...gridPosition.chartData.data} />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">No data</p>
                        </div>
                    )
                }
            />
        </div>
    );
}
