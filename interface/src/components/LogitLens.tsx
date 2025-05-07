"use client";

import { useState, useEffect } from "react";
import {
    Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptBuilder } from "@/components/prompt-builders/PromptBuilder";
import { ModelSelector } from "./ModelSelector";
import { LogitLensResponse, LogitLensWorkspace } from "@/types/lens";

import { Layout } from "@/types/workspace";

import { ChartSelector } from "@/components/charts/ChartSelector";

import config from "@/lib/config";
import { WorkbenchMode } from "./WorkbenchMode";
import { Annotations } from "@/components/charts/Annotations";

import { ResizableLayout } from "@/components/Layout";
import { useLensCompletions } from "@/hooks/useLensCompletions";
import { useAnnotations } from "@/hooks/useAnnotations";
import { WorkspaceHistory } from "./WorkspaceHistory";
import { useWorkspaceStore } from "@/stores/workspace";

type ModelLoadStatus = 'loading' | 'success' | 'error';
type WorkbenchMode = "logit-lens" | "activation-patching";

interface LogitLensProps {
    modelLoadStatus: ModelLoadStatus;
    setModelLoadStatus: (status: ModelLoadStatus) => void;
    workbenchMode: WorkbenchMode;
    setWorkbenchMode: (mode: WorkbenchMode) => void;
}

export function LogitLens({ modelLoadStatus, setModelLoadStatus, workbenchMode, setWorkbenchMode }: LogitLensProps) {
    const [modelType, setModelType] = useState<"chat" | "base">("base");
    const [modelName, setModelName] = useState<string>("");
    const [annotationsOpen, setAnnotationsOpen] = useState(false);

    const {
        activeCompletions,
        handleDeleteCompletion,
        handleUpdateCompletion,
        handleNewCompletion,
        setActiveCompletions
    } = useLensCompletions();

    const {
        annotations,
        activeAnnotation,
        setAnnotations,
        setActiveAnnotation,
        annotationText,
        setAnnotationText,
        addAnnotation,
        cancelAnnotation,
        deleteAnnotation
    } = useAnnotations();

    // Add a completion when model successfully loads
    useEffect(() => {
        if (modelLoadStatus === 'success' && modelName !== "") {
            handleNewCompletion(modelName);
        }
    }, [modelLoadStatus]); // Only run when model load status changes

    const [chartData, setChartData] = useState<LogitLensResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const toggleAnnotations = () => {
        setAnnotationsOpen(!annotationsOpen);
    }

    const handleLoadWorkspace = (workspace: LogitLensWorkspace) => {
        // Clear existing state
        setChartData(null);
        
        // Update completions
        setActiveCompletions(workspace.completions);
        
        // Update chart data
        setChartData(workspace.graphData);
        
        // Update annotations
        setAnnotations(workspace.annotations);
    };

    const handleRun = async () => {
        setIsLoading(true);
        setChartData(null);

        try {
            const response = await fetch(config.getApiUrl(config.endpoints.lens), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ completions: activeCompletions }),
            });
            const data = await response.json();

            console.log(data);
            setChartData(data);
        } catch (error) {
            console.error('Error sending request:', error);
            setChartData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const [layout, setLayout] = useState<Layout>("1x1");

    // Handler to update model load status based on boolean from child
    const handleModelLoadStatusUpdate = (success: boolean) => {
        setModelLoadStatus(success ? 'success' : 'error');
    };

    return (
        <div className="flex flex-1 min-h-0">
            {/* Left sidebar */}
            <div className="w-64 border-r">
                <WorkspaceHistory 
                    chartData={chartData}
                    completions={activeCompletions}
                    annotations={annotations}
                    onLoadWorkspace={handleLoadWorkspace}
                />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                {/* Top bar within main content */}
                <WorkbenchMode toggleAnnotations={toggleAnnotations} setLayout={setLayout} handleRun={handleRun} workbenchMode={workbenchMode} setWorkbenchMode={setWorkbenchMode} />

                <ResizableLayout 
                    annotationsOpen={annotationsOpen}
                    workbench={
                        <div className="h-full flex flex-col">
                            <div className="p-4 border-b">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-medium">Model</h2>

                                    <div className="flex items-center gap-2">
                                        <ModelSelector
                                            modelName={modelName}
                                            setModelName={setModelName}
                                            setModelType={setModelType}
                                            setLoaded={handleModelLoadStatusUpdate}
                                        />

                                        <Button
                                            size="sm"
                                            className="w-100"
                                            onClick={() => handleNewCompletion(modelName)}
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
                            layout={layout}
                            chartData={chartData}
                            isLoading={isLoading}
                            annotations={annotations}
                            setActiveAnnotation={setActiveAnnotation}
                            setChartData={setChartData}
                        />
                    }
                    annotations={
                        <Annotations
                            annotations={annotations}
                            activeAnnotation={activeAnnotation}
                            annotationText={annotationText}
                            setAnnotationText={setAnnotationText}
                            addAnnotation={addAnnotation}
                            cancelAnnotation={cancelAnnotation}
                            deleteAnnotation={deleteAnnotation}
                        />
                    }
                />
            </div>
        </div>
    );
}
