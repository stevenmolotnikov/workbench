"use client";

import { useState } from "react";
import {
    Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptBuilder } from "@/components/PromptBuilder";
import { ChatHistory } from "@/components/ChatHistory";
import { ModelSelector } from "./ModelSelector";
import { LogitLensResponse } from "@/types/session";

import { Layout } from "@/types/layout";
import { cn } from "@/lib/utils";
import { ChartSelector } from "@/components/charts/ChartSelector";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import config from "@/lib/config";
import { WorkbenchMode } from "./WorkbenchMode";
import { Annotations } from "@/components/charts/Annotations";

import { ResizableLayout } from "@/components/Layout";
import { useConversations } from "@/hooks/useConversations";
import { useAnnotations } from "@/hooks/useAnnotations";
type ModelLoadStatus = 'loading' | 'success' | 'error';
type WorkbenchMode = "logit-lens" | "activation-patching";

interface LogitLensProps {
    modelLoadStatus: ModelLoadStatus;
    setModelLoadStatus: (status: ModelLoadStatus) => void;
    workbenchMode: WorkbenchMode;
    setWorkbenchMode: (mode: WorkbenchMode) => void;
}

interface Annotation {
    id: string;
    x: number;
    y: number;
    text: string;
    timestamp: number;
}

export function LogitLens({ modelLoadStatus, setModelLoadStatus, workbenchMode, setWorkbenchMode }: LogitLensProps) {
    const [modelType, setModelType] = useState<"chat" | "base">("base");
    const [modelName, setModelName] = useState<string>("EleutherAI/gpt-j-6b");
    
    const {
        savedConversations,
        activeConversations,
        handleLoadConversation,
        handleSaveConversation,
        handleDeleteConversation,
        handleUpdateConversation,
        handleIDChange
    } = useConversations();

    const [chartData, setChartData] = useState<LogitLensResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

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

    const handleRun = async () => {
        setIsLoading(true);
        setChartData(null);
        try {
            const response = await fetch(config.getApiUrl(config.endpoints.lens), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ conversations: activeConversations }),
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

    const [layout, setLayout] = useState<Layout>("1x1");

    // Handler to update model load status based on boolean from child
    const handleModelLoadStatusUpdate = (success: boolean) => {
        setModelLoadStatus(success ? 'success' : 'error');
    };

    return (

        <div className="flex flex-1 min-h-0">
            {/* Left sidebar */}
            <div className="w-64 border-r ">
                <ChatHistory
                    savedConversations={savedConversations}
                    onLoadConversation={handleLoadConversation}
                    activeConversationIds={activeConversations.map(conv => conv.id)}
                />
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

                                        <TooltipProvider>
                                            <Tooltip delayDuration={0} >
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        className={cn("w-100", {
                                                            "opacity-50": activeConversations.some(conv => conv.id === "Untitled")
                                                        })}
                                                        onClick={() => handleLoadConversation({
                                                            name: "Untitled",
                                                            type: modelType,
                                                            model: modelName,
                                                            id: "Untitled",
                                                            messages: [{ role: "user", content: "" }],
                                                            prompt: "",
                                                            isExpanded: true,
                                                            isNew: true,
                                                            selectedTokenIndices: [-1]
                                                        })}
                                                    >
                                                        New
                                                        <Plus size={16} />
                                                    </Button>
                                                </TooltipTrigger>
                                                {activeConversations.some(conv => conv.id === "Untitled") && (
                                                    <TooltipContent side="right">
                                                        <p>'Untitled' already exists.</p>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>
                            </div>

                            <PromptBuilder
                                conversations={activeConversations}
                                onUpdateConversation={handleUpdateConversation}
                                onSaveConversation={handleSaveConversation}
                                onDeleteConversation={handleDeleteConversation}
                                onIDChange={handleIDChange}
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
