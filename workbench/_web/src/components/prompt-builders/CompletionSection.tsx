"use client";

import { Grid3x3, Plus } from "lucide-react";
import { CompletionCard } from "@/components/prompt-builders/CompletionCard";
import { useSelectedModel } from "@/stores/useSelectedModel";
import { TooltipButton } from "@/components/ui/tooltip-button";
import type { LensCompletion } from "@/types/lens";
import { useLensLine, useLensGrid, useCreateLensChart } from "@/lib/api/chartApi";
import { useCreateLensCompletion } from "@/lib/api/lensApi";

import { useQuery } from "@tanstack/react-query";
import { getLensChartConfigByPosition, getLensCharts } from "@/lib/queries/chartQueries";
import { useParams } from "next/navigation";
import { LensConfig } from "@/types/lens";

export function CompletionSection({ chartId, sectionIdx }: { chartId: string, sectionIdx: number }) {
    const lensLineMutation = useLensLine();
    const lensGridMutation = useLensGrid();
    const createLensCompletionMutation = useCreateLensCompletion(); 
    const createChartMutation = useCreateLensChart();
    const { modelName } = useSelectedModel();
    const { workspaceId } = useParams();


    const { data: chartConfig } = useQuery({
        queryKey: ["lensChartConfig", workspaceId, sectionIdx],
        queryFn: () => getLensChartConfigByPosition(workspaceId as string, sectionIdx),
    });

    const { data: charts } = useQuery({
        queryKey: ["lensCharts", workspaceId],
        queryFn: () => getLensCharts(workspaceId as string),
    });

    const chartConfigData = chartConfig?.data as LensConfig;
    const completions: LensCompletion[] = chartConfigData?.completions || [];

    async function createLineChart() {
        if (!chartConfig?.chartId) {
            console.error("No chart available");
            return;
        }
        try {
            const data = await lensLineMutation.mutateAsync({
                completions: completions,
                chartId: chartConfig.chartId
            });
            
            return data;
        } catch (error) {
            console.error("Error creating line chart:", error);
            throw error;
        }
    }

    async function createHeatmap() {
        if (!chartConfig?.chartId) {
            console.error("No chart available");
            return;
        }
        try {
            // This just uses the first one for now...
            const data = await lensGridMutation.mutateAsync({
                completions: completions,
                chartId: chartConfig.chartId
            });
            
            return data;
        } catch (error) {
            console.error("Error creating heatmap:", error);
            throw error;
        }
    }

    async function createCompletion() {
        if (!modelName) {
            console.error("Missing model name");
            return;
        }
        
        try {
            await createLensCompletionMutation.mutateAsync({
                prompt: "",
                model: modelName,
                chartId: chartId,
                workspaceId: workspaceId as string,
                sectionIdx: sectionIdx,
            });
        } catch (error) {
            console.error("Failed to create completion:", error);
        }
    }

    return (
        <div className="border-b p-4">

            <div className="flex items-center pb-4 justify-end">

                <div className="flex items-center gap-2">
                    {/* <TooltipButton
                        size="icon"
                        onClick={async () => await addChartToAllCompletions(0)}
                        disabled={sectionCompletions.length === 0}
                        tooltip="Add line charts to all completions"
                    >
                        <LineChart size={16} />
                    </TooltipButton> */}

                    <TooltipButton
                        size="icon"
                        onClick={async () => await createHeatmap()}
                        disabled={completions.length === 0}
                        tooltip="Add grid charts to all completions"
                    >
                        <Grid3x3 size={16} />
                    </TooltipButton>

                    <TooltipButton
                        size="icon"
                        onClick={createCompletion}
                        id="new-completion"
                        disabled={completions.length >= 5 || createLensCompletionMutation.isPending}
                        tooltip="Create a new completion"
                    >
                        {createLensCompletionMutation.isPending ? (
                            <div className="animate-spin h-4 w-4 border border-current border-t-transparent rounded-full" />
                        ) : (
                            <Plus size={16} />
                        )}
                    </TooltipButton>
                </div>
            </div>

            <div className="flex-1 space-y-4">
                {completions?.map((completion, index) => (
                    <CompletionCard 
                        key={index} 
                        completion={completion}
                        chartId={chartConfig?.chartId || ""}
                        completionIdx={index}
                    />
                ))}
                {(!completions || completions.length === 0) && (
                    <div className="border rounded border-dashed hover:border-primary transition-all duration-300 cursor-pointer" onClick={createCompletion}>
                        <p className="text-center text-sm py-4">
                            {createChartMutation.isPending ? "Creating chart..." : "Add a completion"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}