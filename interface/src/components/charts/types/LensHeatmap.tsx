import { useState } from "react";
import { Heatmap } from "@/components/charts/base/Heatmap";
import { useCharts } from "@/stores/useCharts";
import { useLensCompletions } from "@/stores/useLensCompletions";
import { ChartCard } from "../ChartCard";
import { useMemo } from "react";

import {
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAnnotations } from "@/stores/useAnnotations";
import { useStatusUpdates } from "@/hooks/useStatusUpdates";

export function LensHeatmap({ index }: { index: number }) {
    const [isLoading, setIsLoading] = useState(false);
    const [completionIndex, setCompletionIndex] = useState<string>("1");

    const { annotations, setAnnotations } = useAnnotations();
    const { gridPositions, removeChart, setChartData } = useCharts();

    const gridPosition = gridPositions[index];

    const handleRemoveChart = () => {
        setAnnotations(
            annotations.filter((a) => !(a.type === "heatmap" && a.data.chartIndex === index))
        );
        removeChart(index);
    };

    const handleRunChart = async () => {
        setIsLoading(true);

        const { startStatusUpdates, stopStatusUpdates } = useStatusUpdates.getState();

        startStatusUpdates();

        try {
            const { activeCompletions } = useLensCompletions.getState();
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
            stopStatusUpdates();
        }
    };

    const activeCompletionsLength = useLensCompletions((state) => state.activeCompletions.length);
    const memoizedCompletionItems = useMemo(() => {
        return activeCompletionsLength >= 1 ? (
            Array.from({ length: activeCompletionsLength }, (_, i) => (
                <DropdownMenuRadioItem key={i} value={`${i + 1}`}>
                    {i + 1}
                </DropdownMenuRadioItem>
            ))
        ) : (
            <DropdownMenuItem disabled>No completions</DropdownMenuItem>
        );
    }, [activeCompletionsLength]);

    return (
        <ChartCard
            handleRunChart={handleRunChart}
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
            configContent={
                <>
                    <DropdownMenuLabel>Set Completion</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                        value={completionIndex}
                        onValueChange={setCompletionIndex}
                    >
                        {memoizedCompletionItems}
                    </DropdownMenuRadioGroup>
                </>
            }
        />
    );
}
