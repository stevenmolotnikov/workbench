import { useState, useEffect } from "react";
import { LineGraph } from "@/components/charts/primatives/LineGraph";
import { useCharts } from "@/stores/useCharts";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { ChartCard } from "../ChartCard";
import { useAnnotations } from "@/stores/useAnnotations";
import type { Annotation } from "@/stores/useAnnotations";
import { useStatusUpdates } from "@/hooks/useStatusUpdates";

import type { LensCompletion, TokenCompletion } from "@/types/lens";

// Generate a unique ID for the job
const generateJobId = (): string => {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
};

export function LensLineGraph({ index }: { index: number }) {
    const [isLoading, setIsLoading] = useState(false);

    const { gridPositions, removeChart, setChartData } = useCharts();
    const { annotations, setAnnotations } = useAnnotations();

    const gridPosition = gridPositions[index];

    const handleRemoveChart = () => {
        // Mark annotations as orphaned instead of deleting them
        const orphanedAnnotations = annotations.map((a: Annotation) => {
            if ((a.type === "lineGraph" || a.type === "lineGraphRange") && a.data.chartIndex === index) {
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

    const hasTargetToken = (compl: LensCompletion) => {
        const tokens = compl.tokens;
        return tokens.some((token: TokenCompletion) => token.target_id !== null);
    };

    const handleRunChart = async () => {
        setIsLoading(true);

        const { startStatusUpdates, stopStatusUpdates } = useStatusUpdates.getState();
        const jobId = generateJobId();
        
        startStatusUpdates(jobId);

        try {
            const {completions} = useLensWorkspace.getState();

            const filteredCompletions = completions.filter((compl) => hasTargetToken(compl));

            // console.log(JSON.stringify(completions, null, 2))
            const response = await fetch("/api/lens-line", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    completions: filteredCompletions,
                    job_id: jobId,
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
            chart={gridPosition.chartData && gridPosition.chartData.type === 'lineGraph' ? (
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
