"use client";

import { Plus } from "lucide-react";
import { CompletionCard } from "@/components/prompt-builders/CompletionCard";
import { useSelectedModel } from "@/stores/useSelectedModel";
import { TooltipButton } from "@/components/ui/tooltip-button";
import type { LensCompletion } from "@/types/lens";
import { useLensLine, useLensGrid, useCreateChart } from "@/lib/api/chartApi";
import { useCreateLensCompletion } from "@/lib/api/lensApi";

import { useQuery } from "@tanstack/react-query";
import { getLensChartByPosition } from "@/lib/queries/chartQueries";
import { useParams } from "next/navigation";


export function CompletionSection({ sectionIdx }: { sectionIdx: number }) {
    const lensLineMutation = useLensLine();
    const lensGridMutation = useLensGrid();
    const createLensCompletionMutation = useCreateLensCompletion(); 
    const createChartMutation = useCreateChart();
    const { modelName } = useSelectedModel();
    const { workspaceId } = useParams();

    const { data: chart } = useQuery({
        queryKey: ["lensCharts", workspaceId, sectionIdx],
        queryFn: () => getLensChartByPosition(workspaceId as string, sectionIdx),
    });

    const completions = (chart?.workspaceData as { completions: LensCompletion[] })?.completions || [];


    async function createLineChart(completion: LensCompletion) {
        if (!chart?.id) {
            console.error("No chart available");
            return;
        }
        try {
            const data = await lensLineMutation.mutateAsync({
                completions: [completion],
                chartId: chart.id
            });
            
            return data;
        } catch (error) {
            console.error("Error creating line chart:", error);
            throw error;
        }
    }

    async function createHeatmap(completion: LensCompletion) {
        if (!chart?.id) {
            console.error("No chart available");
            return;
        }
        try {
            const data = await lensGridMutation.mutateAsync({
                completions: [completion],
                chartId: chart.id
            });
            
            return data;
        } catch (error) {
            console.error("Error creating heatmap:", error);
            throw error;
        }
    }

    async function createCompletion() {
        if (!chart?.id || !modelName) {
            console.log(chart, modelName);
            console.error("Missing chart ID or model name");
            return;
        }
        
        try {
            await createLensCompletionMutation.mutateAsync({
                prompt: "",
                model: modelName,
                chartId: chart.id,
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
                    </TooltipButton>

                    <TooltipButton
                        size="icon"
                        onClick={async () => await addChartToAllCompletions(1)}
                        disabled={sectionCompletions.length === 0}
                        tooltip="Add grid charts to all completions"
                    >
                        <Grid3x3 size={16} />
                    </TooltipButton> */}

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
                {completions?.map((compl,) => (
                    <CompletionCard 
                        key={compl.id} 
                        completion={compl}
                        chartId={chart?.id || ""}
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