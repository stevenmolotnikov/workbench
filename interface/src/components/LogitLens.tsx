"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptBuilder } from "@/components/prompt-builders/PromptBuilder";
import { ModelSelector } from "./ModelSelector";
import {
    LogitLensResponse,
    LogitLensWorkspace,
    LogitLensModes,
} from "@/types/lens";
import { WorkbenchMenu } from "./WorkbenchMenu";

import { Layout } from "@/types/workspace";

import { ChartSelector } from "@/components/charts/ChartSelector";

import config from "@/lib/config";

import { ResizableLayout } from "@/components/Layout";
import { WorkspaceHistory } from "./WorkspaceHistory";

import { useLineGraphAnnotations } from "@/stores/lineGraphAnnotations";
import { useLensCompletions } from "@/hooks/useLensCompletions";

import { useModelStore } from "@/stores/useModelStore";
import { fetchLogitLensData } from "@/api/lens";

export function LogitLens() {
    const [annotationsOpen, setAnnotationsOpen] = useState(false);
    const [chartData, setChartData] = useState<LogitLensResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [layout, setLayout] = useState<Layout>("1x1");

    const { modelName } = useModelStore();

    const {
        activeCompletions,
        handleDeleteCompletion,
        handleUpdateCompletion,
        handleNewCompletion,
        setActiveCompletions,
    } = useLensCompletions();
    // const { setAnnotations } = useLineGraphAnnotations();

    const toggleAnnotations = () => {
        setAnnotationsOpen(!annotationsOpen);
    };

    const handleLoadWorkspace = (workspace: LogitLensWorkspace) => {
        setChartData(null);
        setActiveCompletions(workspace.completions);
        setChartData(workspace.graphData);
        // setAnnotations(workspace.annotations);
    };

    const handleRun = async () => {
        setIsLoading(true);
        setChartData(null);

        try {
            const data = await fetchLogitLensData(activeCompletions);
            setChartData(data);
        } catch (error) {
            console.error("Error sending request:", error);
            setChartData(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-1 min-h-0">
            {/* Left sidebar */}
            <div className="w-64 border-r">
                <WorkspaceHistory
                    chartData={chartData}
                    completions={activeCompletions}
                    onLoadWorkspace={handleLoadWorkspace}
                />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                {/* Top bar within main content */}
                <WorkbenchMenu
                    toggleAnnotations={toggleAnnotations}
                    setLayout={setLayout}
                    handleRun={handleRun}
                />

                <ResizableLayout
                    annotationsOpen={annotationsOpen}
                    workbench={
                        <div className="h-full flex flex-col">
                            <div className="p-4 border-b">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-medium">
                                        Model
                                    </h2>

                                    <div className="flex items-center gap-2">
                                        <ModelSelector />

                                        <Button
                                            size="sm"
                                            className="w-100"
                                            onClick={() =>
                                                handleNewCompletion(modelName)
                                            }
                                        >
                                            New
                                            <Plus size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <PromptBuilder
                                completions={activeCompletions}
                                onUpdateCompletion={handleUpdateCompletion}
                                onDeleteCompletion={handleDeleteCompletion}
                            />
                        </div>
                    }
                    charts={
                        <ChartSelector
                            modes={LogitLensModes}
                            layout={layout}
                            chartData={chartData}
                            isLoading={isLoading}
                            setChartData={setChartData}
                        />
                    }
                />
            </div>
        </div>
    );
}
