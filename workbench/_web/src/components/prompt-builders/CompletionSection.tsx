"use client";

import { Plus, Settings2, LineChart, Grid3x3 } from "lucide-react";
import { ModelSelector } from "@/components/ModelSelector";
import { CompletionCard } from "@/components/prompt-builders/CompletionCard";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { useSelectedModel } from "@/stores/useSelectedModel";
import { useTutorialManager } from "@/hooks/useTutorialManager";
import { useModels } from "@/hooks/useModels";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { useStatusUpdates } from "@/hooks/useStatusUpdates";
import type { LensCompletion } from "@/types/lens";
import { useLensLine, useLensGrid, useCreateCompletion } from "@/app/api/lensApi";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getCharts } from "@/lib/queries/chartQueries";
import { eq , and} from "drizzle-orm";
import { charts } from "@/db/schema";


export function CompletionSection({ sectionIdx, workspaceId }: { sectionIdx: number; workspaceId: string }) {
    const lensLineMutation = useLensLine();
    const lensGridMutation = useLensGrid();
    const createCompletionMutation = useCreateCompletion();
    const { handleClick } = useTutorialManager();
    const { modelName } = useSelectedModel();

    // Query to get charts for this section
    const { data: chartsData } = useQuery({
        queryKey: ["lensCharts", workspaceId, sectionIdx],
        queryFn: () => getCharts(workspaceId, and(eq(charts.position, sectionIdx), eq(charts.workspaceType, "lens")))
    });

    const chart = chartsData?.[0];
    const completions = (chart?.workspaceData as { completions: LensCompletion[] })?.completions || [];

    async function createLineChart(completion: LensCompletion) {
        const chartId = chart?.id || `chart-${Date.now()}`;
        
        try {
            const data = await lensLineMutation.mutateAsync({
                completions: [completion],
                chartId: chartId
            });
            
            return data;
        } catch (error) {
            console.error("Error creating line chart:", error);
            throw error;
        }
    }

    async function createHeatmap(completion: LensCompletion) {
        const chartId = chart?.id || `chart-${Date.now()}`;
        
        try {
            const data = await lensGridMutation.mutateAsync({
                completions: [completion],
                chartId: chartId
            });
            
            return data;
        } catch (error) {
            console.error("Error creating heatmap:", error);
            throw error;
        }
    }

    async function createNewCompletion() {
        if (!chart?.id || !modelName) {
            console.error("Missing chart ID or model name");
            return;
        }
        
        try {
            await createCompletionMutation.mutateAsync({
                prompt: "",
                model: modelName,
                chartId: chart.id,
                sectionIdx: sectionIdx
            });
            handleClick("#new-completion");
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
                        onClick={createNewCompletion}
                        id="new-completion"
                        disabled={completions.length >= 5}
                        tooltip="Create a new completion"
                    >
                        <Plus size={16} />
                    </TooltipButton>
                </div>
            </div>

            <div className="flex-1 space-y-4">
                {completions?.map((compl, index) => (
                    <CompletionCard key={compl.id} compl={compl} index={index} />
                ))}
                {(!completions || completions.length === 0) && (
                    <div className="border rounded border-dashed hover:border-primary transition-all duration-300 cursor-pointer" onClick={createNewCompletion}>
                        <p className="text-center text-sm py-4">Add a completion</p>
                    </div>
                )}
            </div>
        </div>
    );
}