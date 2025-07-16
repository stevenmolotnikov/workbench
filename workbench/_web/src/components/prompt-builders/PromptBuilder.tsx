"use client";

import { Plus, Settings2 } from "lucide-react";
import { ModelSelector } from "@/components/ModelSelector";
import { CompletionCard } from "@/components/prompt-builders/CompletionCard";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { useSelectedModel } from "@/stores/useSelectedModel";
import { useTutorialManager } from "@/hooks/useTutorialManager";
import { useModels } from "@/hooks/useModels";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { useState } from "react";

import * as React from "react";

import { CompletionSection } from "@/components/prompt-builders/CompletionSection";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getLensCharts } from "@/lib/queries/chartQueries";
import { useCreateLensChart } from "@/lib/api/chartApi";


export function DropdownMenuCheckboxes() {
    const { tokenizeOnEnter, graphOnTokenize, setTokenizeOnEnter, setGraphOnTokenize } = useLensWorkspace();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="icon">
                    <Settings2 size={16} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Completion Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                    checked={tokenizeOnEnter}
                    onCheckedChange={setTokenizeOnEnter}
                >
                    Tokenize on Enter
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={graphOnTokenize}
                    onCheckedChange={setGraphOnTokenize}
                >
                    Graph on Tokenize
                </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function PromptBuilder() {
    const { isLoading } = useModels();

    const { workspaceId } = useParams();
    const createChartMutation = useCreateLensChart();

    const { data: charts } = useQuery({
        queryKey: ["lensCharts", workspaceId],
        queryFn: () => getLensCharts(workspaceId as string),
    });

    const handleCreateChart = (position: number) => {

        createChartMutation.mutate({
            workspaceId: workspaceId as string,
            position: position,
            type: "lensLine",
        });
    }

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium">Model</h2>

                    <div className="flex items-center gap-2">
                        <ModelSelector />

                        <TooltipButton
                            size="icon"
                            onClick={() => handleCreateChart(charts?.length || 0)}
                            id="new-section"
                            disabled={isLoading || createChartMutation.isPending}
                            tooltip="Create a new section"
                        >
                            {createChartMutation.isPending ? (
                                <div className="animate-spin h-4 w-4 border border-current border-t-transparent rounded-full" />
                            ) : (
                                <Plus size={16} />
                            )}
                        </TooltipButton>

                        <DropdownMenuCheckboxes />
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {charts?.map((chart) => (
                    <CompletionSection key={chart.id} sectionIdx={chart.position} />
                ))}
                {charts?.length === 0 && (
                    <p className="text-center py-4">No active sections. Click + to create a section.</p>
                )}
            </div>
        </div>
    );
}