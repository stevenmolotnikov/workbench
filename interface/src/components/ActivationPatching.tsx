"use client";

import { useState } from "react";

import { ModelSelector } from "./ModelSelector";
import { PatchingWorkbench } from "@/components/connections/PatchingWorkbench";
import { Completion } from "@/types/workspace";
import { ChartSelector } from "@/components/charts/ChartSelector";
import { WorkbenchMode } from "./WorkbenchMode";
import { useConnection } from "@/hooks/useConnection";
import { useAnnotations } from "@/hooks/useAnnotations";
import config from "@/lib/config";
import { WorkspaceHistory } from "@/components/WorkspaceHistory";

import { ResizableLayout } from "@/components/Layout";

import { Layout } from "@/types/workspace";
import { Annotations } from "@/components/charts/Annotations";
import { ActivationPatchingRequest, ActivationPatchingModes, ActivationPatchingWorkspace, ActivationPatchingResponse } from "@/types/activation-patching";

type ModelLoadStatus = 'loading' | 'success' | 'error';
type WorkbenchMode = "logit-lens" | "activation-patching";

interface ActivationPatchingProps {
    modelLoadStatus: ModelLoadStatus;
    setModelLoadStatus: (status: ModelLoadStatus) => void;
    workbenchMode: WorkbenchMode;
    setWorkbenchMode: (mode: WorkbenchMode) => void;
}

export function ActivationPatching({ modelLoadStatus, setModelLoadStatus, workbenchMode, setWorkbenchMode }: ActivationPatchingProps) {
    const [modelType, setModelType] = useState<"chat" | "base">("base");
    const [modelName, setModelName] = useState<string>("EleutherAI/gpt-j-6b");


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


    const demoHeatmapData = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
    ]

    const demoRowLabels = ["Layer 1", "Layer 2", "Layer 3"]
    const demoColLabels = ["Token 1", "Token 2", "Token 3"]

    const demoChartData: ActivationPatchingResponse = {
        results: demoHeatmapData,
        rowLabels: demoRowLabels,
        colLabels: demoColLabels
    }

    const [chartData, setChartData] = useState<ActivationPatchingResponse | null>(demoChartData);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [layout, setLayout] = useState<Layout>("1x1");
    const [annotationsOpen, setAnnotationsOpen] = useState<boolean>(false);

    const toggleAnnotations = () => {
        setAnnotationsOpen(!annotationsOpen);
    }

    // Handler to update model load status based on boolean from child
    const handleModelLoadStatusUpdate = (success: boolean) => {
        setModelLoadStatus(success ? 'success' : 'error');
    };

    const makeDefaultCompletion = (name: string): Completion => {
        return {
            id: name,
            prompt: ""
        }
    }




    const [source, setSource] = useState<Completion>(makeDefaultCompletion("source"));
    const [destination, setDestination] = useState<Completion>(makeDefaultCompletion("destination"));

    const connectionsHook = useConnection();

    const request: ActivationPatchingRequest = {
        connections: connectionsHook.connections,
        model: modelName,
        source: source,
        destination: destination,
        submodule: "blocks",
        correct_id: 1,
        incorrect_id: 2,
        patch_tokens: true,
    }

    const handleRun = async () => {
        setIsLoading(true);
        setChartData(null);

        console.log(request);
        
        try {
            const response = await fetch(config.getApiUrl(config.endpoints.patch), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });
            const data = await response.json();
            setChartData(data);
        } catch (error) {
            console.error('Error sending request:', error);
            setChartData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadWorkspace = (workspace: ActivationPatchingWorkspace) => {
        setSource(workspace.request.source);
        setDestination(workspace.request.destination);
        setChartData(workspace.graphData);
        setAnnotations(workspace.annotations);
    }
        
    return (
        <div className="flex flex-1 min-h-0">
            {/* Left sidebar */}
            <div className="w-64 border-r ">
                <WorkspaceHistory 
                    chartData={chartData}
                    patchingRequest={request}
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
                                    </div>
                                </div>
                            </div>

                            <PatchingWorkbench 
                                connectionsHook={connectionsHook} 
                                source={source} 
                                destination={destination} 
                                setSource={setSource} 
                                setDestination={setDestination} 
                            />
                        </div>
                    }
                    charts={
                        <ChartSelector
                            modes={ActivationPatchingModes}
                            layout={layout}
                            chartData={chartData}
                            isLoading={isLoading}
                            annotations={annotations}
                            activeAnnotation={activeAnnotation}
                            setActiveAnnotation={setActiveAnnotation}
                            annotationText={annotationText}
                            setAnnotationText={setAnnotationText}
                            addAnnotation={addAnnotation}
                            cancelAnnotation={cancelAnnotation}
                            deleteAnnotation={deleteAnnotation}
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
