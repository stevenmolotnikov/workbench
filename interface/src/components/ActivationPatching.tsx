"use client";

import { useState } from "react";

import { ModelSelector } from "./ModelSelector";
import { PatchingWorkbench } from "@/components/connections/PatchingWorkbench";
import { Completion } from "@/types/workspace";
import { LogitLensResponse } from "@/types/lens";
import { ChartSelector } from "@/components/charts/ChartSelector";
import { WorkbenchMode } from "./WorkbenchMode";
import { useConnection } from "@/hooks/useConnection";
import { useAnnotations } from "@/hooks/useAnnotations";
import config from "@/lib/config";

import { ResizableLayout } from "@/components/Layout";

import ComponentDropdown from "./ComponentDropdown";
import { Layout } from "@/types/workspace";
import { Annotations } from "@/components/charts/Annotations";

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
        setAnnotations,
        activeAnnotation,
        setActiveAnnotation,
        annotationText,
        setAnnotationText,
        addAnnotation,
        cancelAnnotation,
        deleteAnnotation
    } = useAnnotations();

    const [chartData, setChartData] = useState<LogitLensResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [layout, setLayout] = useState<Layout>("1x1");

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

    const handleRun = async () => {
        setIsLoading(true);
        setChartData(null);
        try {
            const response = await fetch(config.getApiUrl(config.endpoints.patch), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    connections: connectionsHook.connections,
                    model: modelName,
                    source: source,
                    destination: destination,
                    submodule: "blocks",
                    correct_id: 1,
                    incorrect_id: 2,
                    patch_tokens: true,
                }),
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

    return (
        <div className="flex flex-1 min-h-0">
            {/* Left sidebar */}
            <div className="w-64 border-r ">
                {/* <ChatHistory
                    savedConversations={savedConversations}
                    onLoadConversation={handleLoadConversation}
                    activeConversationIds={activeConversations.map(conv => conv.id)}
                /> */}
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                {/* Top bar within main content */}
                <WorkbenchMode setLayout={setLayout} handleRun={handleRun} workbenchMode={workbenchMode} setWorkbenchMode={setWorkbenchMode} />

                <ResizableLayout
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
                                        <ComponentDropdown />
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
                            layout={layout}
                            chartData={chartData}
                            isLoading={isLoading}
                            annotations={annotations}
                            setAnnotations={setAnnotations}
                            activeAnnotation={activeAnnotation}
                            setActiveAnnotation={setActiveAnnotation}
                            annotationText={annotationText}
                            setAnnotationText={setAnnotationText}
                            addAnnotation={addAnnotation}
                            cancelAnnotation={cancelAnnotation}
                            deleteAnnotation={deleteAnnotation}
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
