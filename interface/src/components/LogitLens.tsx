"use client";

import { useState } from "react";
import {
    Code,
    Play,
    Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptBuilder } from "@/components/PromptBuilder";
import { ChatHistory } from "@/components/ChatHistory";
import { Conversation } from "@/components/workbench/conversation.types";
import { ModelSelector } from "./ModelSelector";
import { LogitLensResponse } from "@/components/workbench/conversation.types";
import { Textarea } from "@/components/ui/textarea";

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
    const [savedConversations, setSavedConversations] = useState<Conversation[]>([]);
    const [activeConversations, setActiveConversations] = useState<Conversation[]>([]);

    const [chartData, setChartData] = useState<LogitLensResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    // Lifted state for annotations
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [activeAnnotation, setActiveAnnotation] = useState<{x: number, y: number} | null>(null);
    const [annotationText, setAnnotationText] = useState("");

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

    const handleIDChange = (id: string, newID: string) => {
        setActiveConversations(prev => prev.map(conv =>
            conv.id === id
                ? { ...conv, id: newID }
                : conv
        ));
    }

    // Update handleLoadConversation to ADD to active conversations
    const handleLoadConversation = (conversationToLoad: Conversation) => {
        // Check if the conversation (by ID) is already active
        if (activeConversations.some(conv => conv.id === conversationToLoad.id)) {

            console.log("Conversation already active:", conversationToLoad.id);

            return;
        }

        const newActiveConversation = {
            ...conversationToLoad,
            isExpanded: true, // Ensure it's expanded when loaded
            isNew: undefined
        };

        setActiveConversations(prev => [...prev, newActiveConversation]);
    };

    // Update handleSaveConversation to find the conversation in activeConversations
    const handleSaveConversation = (id: string) => {
        const conversationToSave = activeConversations.find(conv => conv.id === id);
        if (conversationToSave) {
            // Create a saveable version (clean up transient flags if any)
            const savedVersion: Conversation = {
                ...conversationToSave,
                isNew: undefined, // Ensure isNew is not saved
            };

            setSavedConversations(prev => {
                // Check if a conversation with the same ID already exists
                const existingIndex = prev.findIndex(conv => conv.id === savedVersion.id);
                if (existingIndex !== -1) {
                    // Update existing conversation
                    const updatedSaved = [...prev];
                    updatedSaved[existingIndex] = savedVersion;
                    return updatedSaved;
                } else {
                    // Add as new saved conversation
                    return [...prev, savedVersion];
                }
            });
            // Optionally, update the title in the active conversation to remove "(unsaved)" if applicable
            handleUpdateConversation(id, { name: savedVersion.id });
        }
    };

    // Update handleDeleteConversation to allow removing the last item
    const handleDeleteConversation = (id: string) => {
        // Remove from active list
        setActiveConversations(prev => {
            const remaining = prev.filter(conv => conv.id !== id);
            return remaining;
        });
    };

    // Add handler to update a specific active conversation
    const handleUpdateConversation = (id: string, updates: Partial<Conversation>) => {
        setActiveConversations(prev => prev.map(conv =>
            conv.id === id
                ? { ...conv, ...updates }
                : conv
        ));
    };

    const [layout, setLayout] = useState<Layout>("1x1");

    // Annotation handlers
    const addAnnotation = () => {
        if (!activeAnnotation || !annotationText.trim()) return;
        
        const newAnnotation: Annotation = {
          id: Date.now().toString(),
          x: activeAnnotation.x,
          y: activeAnnotation.y,
          text: annotationText.trim(),
          timestamp: Date.now(),
        };
        
        setAnnotations(prev => [...prev, newAnnotation]);
        setActiveAnnotation(null);
        setAnnotationText("");
    };

    const cancelAnnotation = () => {
        setActiveAnnotation(null);
        setAnnotationText("");
    };

    const deleteAnnotation = (id: string) => {
        setAnnotations(prev => prev.filter(a => a.id !== id));
    };

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
                <div className="flex flex-1 min-h-0">
                    <div className="w-[35%] border-r flex flex-col">
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

                    {/* Container for charts */}
                    <div className="w-[35%] border-r flex flex-col">
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
                    </div>

                    {/* Annotations panel */}
                    <div className="w-[30%] flex flex-col">
                        <div className="p-4 border-b">
                            <h2 className="text-sm font-medium">Annotations</h2>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            {/* Annotation input form */}
                            {activeAnnotation && (
                                <div className="mb-6 p-4 border rounded-md">
                                    <p className="text-sm font-medium mb-2">Add Annotation at Layer {activeAnnotation.x}</p>
                                    <Textarea
                                        className="w-full mb-3"
                                        placeholder="Enter your annotation here..."
                                        value={annotationText}
                                        onChange={(e) => setAnnotationText(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" onClick={cancelAnnotation}>
                                            Cancel
                                        </Button>
                                        <Button size="sm" onClick={addAnnotation}>
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Annotations list */}
                            {annotations.length === 0 && !activeAnnotation ? (
                                <p className="text-sm text-muted-foreground">No annotations yet. Click on a chart to add annotations.</p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {annotations.map((annotation) => (
                                        <div key={annotation.id} className="flex items-start justify-between rounded-md border p-3 text-sm">
                                            <div>
                                                <p className="font-medium mb-1">Layer: {annotation.x}</p>
                                                <p>{annotation.text}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => deleteAnnotation(annotation.id)}
                                            >
                                                &times;
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}
