import { useState, useEffect } from "react";
import { Heatmap } from "@/components/charts/primatives/Heatmap";
import { useCharts } from "@/stores/useCharts";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
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
import type { Annotation } from "@/stores/useAnnotations";
import { useStatusUpdates } from "@/hooks/useStatusUpdates";

import type { LensCompletion } from "@/types/lens";

// Generate a unique ID for the job
const generateJobId = (): string => {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
};

export function LensHeatmap({ index }: { index: number }) {
    const [isLoading, setIsLoading] = useState(false);

    const { annotations, setAnnotations } = useAnnotations();
    const { removeChart, setChartData } = useCharts();

    const completionIds = useCharts((state) => state.gridPositions[index]?.completion_ids || []);
    const chartData = useCharts((state) => state.gridPositions[index]?.chartData);

    const handleRemoveChart = () => {
        // Mark annotations as orphaned instead of deleting them
        const orphanedAnnotations = annotations.map((a) => {
            if (a.type === "heatmap" && a.data.chartIndex === index) {
                return {
                    ...a,
                    data: {
                        ...a.data,
                        isOrphaned: true,
                        originalChartIndex: a.data.chartIndex,
                    },
                };
            }
            return a;
        });
        setAnnotations(orphanedAnnotations);
        removeChart(index);
    };

    const hasPrompt = (compl: LensCompletion) => {
        return compl.prompt.trim() !== "";
    };

    const handleRunChart = async () => {
        setIsLoading(true);

        const { startStatusUpdates, stopStatusUpdates } = useStatusUpdates.getState();
        const jobId = generateJobId();

        startStatusUpdates(jobId);

        try {
            const { completions } = useLensWorkspace.getState();

            const filteredCompletions = completions.filter((compl) => hasPrompt(compl));

            if (filteredCompletions.length === 0) {
                throw new Error("No completions with prompts found");
            }

            // Use the first completion for the heatmap
            const completion = filteredCompletions[0];

            const response = await fetch("/api/lens-grid", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    completion: completion,
                    job_id: jobId,
                }),
            });

            if (!response.ok) throw new Error(response.statusText);

            const data = await response.json();
            setChartData(index, { type: "heatmap", data });

            console.log("Data", data);
        } catch (error) {
            console.error(`Error executing chart at position ${index}:`, error);
            setChartData(index, null);
        } finally {
            setIsLoading(false);
            stopStatusUpdates();
        }
    };


    useEffect(() => {
        console.log("rerunning", completionIds);
        if (completionIds.length > 0 && !isLoading) {
            console.log(`Auto-running chart ${index} due to completion_ids change`);
            handleRunChart();
        }
    }, [completionIds]);

    const activeCompletionsLength = useLensWorkspace((state) => state.completions.length);
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
        <div
            className="h-full w-full"
        >
            <ChartCard
                handleRunChart={handleRunChart}
                handleRemoveChart={handleRemoveChart}
                isLoading={isLoading}
                chartTitle={
                    <div>
                        <div className="text-md font-bold">Lens Heatmap</div>
                        <span className="text-xs text-muted-foreground">
                            Completion {JSON.stringify(completionIds)}
                        </span>
                    </div>
                }
                chart={
                    chartData ? (
                        <Heatmap chartIndex={index} {...chartData.data} />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">No data</p>
                        </div>
                    )
                }
                // configContent={
                //     <>
                //         <DropdownMenuLabel>Set Completion</DropdownMenuLabel>
                //         <DropdownMenuSeparator />
                //         <DropdownMenuRadioGroup
                //             value={completionIds[0]}
                //             onValueChange={setCompletionIndex}
                //         >
                //             {memoizedCompletionItems}
                //         </DropdownMenuRadioGroup>
                //     </>
                // }
            />
        </div>
    );
}
