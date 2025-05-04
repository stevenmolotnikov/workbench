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

export function LogitLens({modelLoadStatus, setModelLoadStatus, workbenchMode, setWorkbenchMode}: LogitLensProps) {
    const [modelType, setModelType] = useState<"chat" | "base">("base");
    const [modelName, setModelName] = useState<string>("EleutherAI/gpt-j-6b");
    const [savedConversations, setSavedConversations] = useState<Conversation[]>([]);
    const [activeConversations, setActiveConversations] = useState<Conversation[]>([]);

    const [chartData, setChartData] = useState<LogitLensResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

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
            const data: LogitLensResponse = await response.json();
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
                <div className="p-4 border-b flex items-center justify-between">
                    <WorkbenchMode workbenchMode={workbenchMode} setWorkbenchMode={setWorkbenchMode} />
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" disabled={true}>
                            <Code size={16} />
                            Code
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleRun}
                            className={cn({
                                "opacity-50": activeConversations.length === 0
                            })}
                        >
                            <Play size={16} />
                            Run
                        </Button>
                    </div>
                </div>

                <div className="flex flex-1 min-h-0">
                    <div className="w-[40%] border-r flex flex-col">
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
                    <ChartSelector chartData={chartData} isLoading={isLoading} />
                </div>
            </div>
        </div>

    );
}
