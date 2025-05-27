import { useState } from "react";
import { Heatmap } from "@/components/charts/base/Heatmap";
import { useCharts } from "@/stores/useCharts";
import { useLensCompletions } from "@/stores/useLensCompletions";
import { ChartCard } from "../ChartCard";

import {
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function LensHeatmap({ index }: { index: number }) {
    const [isLoading, setIsLoading] = useState(false);

    const { activeCompletions } = useLensCompletions();
    const { gridPositions, removeChart, setChartData } = useCharts();

    const [completionIndex, setCompletionIndex] = useState<string>("1");

    const gridPosition = gridPositions[index];

    const handleRunChart = async () => {
        setIsLoading(true);

        try {
            const response = await fetch("/api/lens-grid", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    completion: activeCompletions[parseInt(completionIndex) - 1],
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
            handleRemoveChart={() => removeChart(index)}
            isLoading={isLoading}
            chartTitle={
                <div>
                    <div className="text-lg font-medium">Lens Heatmap</div>
                    <span className="text-sm text-muted-foreground">Completion {completionIndex}</span>
                </div>
            }
            chart={
                gridPosition.chartData ? (
                    <Heatmap {...gridPosition.chartData.data} />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No data</p>
                    </div>
                )
            }
            configContent={
                <>
                    <DropdownMenuLabel>Set Completion</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={completionIndex} onValueChange={setCompletionIndex}>
                        {activeCompletions.length >= 1 ? (
                            activeCompletions.map((_, i) => (
                                <DropdownMenuRadioItem key={i} value={`${i + 1}`}>
                                    {i + 1}
                                </DropdownMenuRadioItem>
                            ))
                        ) : (
                            <DropdownMenuItem disabled>No completions</DropdownMenuItem>
                        )}
                    </DropdownMenuRadioGroup>
                </>
            }
        />
    );
}
