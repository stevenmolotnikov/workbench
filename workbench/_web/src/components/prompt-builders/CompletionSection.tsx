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

import * as React from "react";


export function CompletionSection({ sectionIdx }: { sectionIdx: number }) {
    const { handleNewCompletion, getCompletionsBySection, handleUpdateCompletion } = useLensWorkspace();
    const { isLoading } = useModels();
    const { handleClick } = useTutorialManager();
    const { modelName } = useSelectedModel();

    const sectionCompletions = getCompletionsBySection(sectionIdx);

    function createNewCompletion() {
        handleNewCompletion(modelName, sectionIdx);
        handleClick("#new-completion");
    }

    async function createLineChart(completion: LensCompletion) {
        const { startStatusUpdates, stopStatusUpdates } = useStatusUpdates.getState();
        const jobId = `chart-${completion.id}-${Date.now()}`;
        
        startStatusUpdates(jobId);

        try {
            const response = await fetch("/api/lens-line", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    completions: [completion],
                    job_id: jobId 
                }),
            });

            if (!response.ok) throw new Error(response.statusText);
            const data = await response.json();
            
            // Update completion with chart mode
            handleUpdateCompletion(completion.id, { chartMode: 0 });
            
            return data;
        } catch (error) {
            console.error("Error creating line chart:", error);
            throw error;
        } finally {
            stopStatusUpdates();
        }
    }

    async function createHeatmap(completion: LensCompletion) {
        const { startStatusUpdates, stopStatusUpdates } = useStatusUpdates.getState();
        const jobId = `chart-${completion.id}-${Date.now()}`;
        
        startStatusUpdates(jobId);

        try {
            const response = await fetch("/api/lens-grid", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    completion: completion,
                    job_id: jobId,
                }),
            });

            if (!response.ok) throw new Error(response.statusText);
            const data = await response.json();
            
            // Update completion with chart mode
            handleUpdateCompletion(completion.id, { chartMode: 1 });
            
            return data;
        } catch (error) {
            console.error("Error creating heatmap:", error);
            throw error;
        } finally {
            stopStatusUpdates();
        }
    }

    async function addChartToAllCompletions(chartMode: number) {
        const chartFunction = chartMode === 0 ? createLineChart : createHeatmap;
        
        // Process completions that don't already have a chart
        const completionsToProcess = sectionCompletions.filter(compl => compl.chartMode === undefined);
        
        // Create charts for all completions in parallel
        await Promise.all(
            completionsToProcess.map(compl => chartFunction(compl))
        );
    }

    return (
        <div className="border-b p-4">

            <div className="flex items-center pb-4 justify-end">

                <div className="flex items-center gap-2">
                    <TooltipButton
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
                    </TooltipButton>

                    <TooltipButton
                        size="icon"
                        onClick={createNewCompletion}
                        id="new-completion"
                        disabled={isLoading || sectionCompletions.length >= 5}
                        tooltip="Create a new completion"
                    >
                        <Plus size={16} />
                    </TooltipButton>
                </div>
            </div>

            <div className="flex-1 space-y-4">
                {sectionCompletions.map((compl, index) => (
                    <CompletionCard key={compl.id} compl={compl} index={index} />
                ))}
                {sectionCompletions.length === 0 && (
                    <div className="border rounded border-dashed hover:border-primary transition-all duration-300 cursor-pointer" onClick={createNewCompletion}>
                        <p className="text-center text-sm py-4">Add a completion</p>
                    </div>
                )}
            </div>
        </div>
    );
}