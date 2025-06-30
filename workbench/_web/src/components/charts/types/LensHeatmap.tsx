import { useState, useEffect } from "react";
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
        setAnnotations(
            annotations.filter((a) => !(a.type === "heatmap" && a.data.chartIndex === index))
        );
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
            const { activeCompletions } = useLensCompletions.getState();

            const filteredCompletions = activeCompletions.filter((compl) => hasPrompt(compl));

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

    const handleEmphasizeCompletion = (index: number) => {
        console.log("Emphasizing completion", index);
        const { emphasizedCompletions, setEmphasizedCompletions } = useLensCompletions.getState();
        if (index === -1) {
            setEmphasizedCompletions([]);
        } else {
            setEmphasizedCompletions([...emphasizedCompletions, index]);
        }
    };

    useEffect(() => {
        return () => {
            handleEmphasizeCompletion(-1);
        };
    }, [completionIds]);

    useEffect(() => {
        console.log("rerunning", completionIds);
        if (completionIds.length > 0 && !isLoading) {
            console.log(`Auto-running chart ${index} due to completion_ids change`);
            handleRunChart();
        }
    }, [completionIds]);

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
        <div
            onMouseEnter={() => handleEmphasizeCompletion(Number.parseInt(completionIds[0]))}
            onMouseLeave={() => handleEmphasizeCompletion(-1)}
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
