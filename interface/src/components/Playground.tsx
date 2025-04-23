"use client";

import { useState } from "react";
import {
    Code,
    Play,
    Plus,
    LayoutGrid,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Workbench } from "@/components/Workbench";
import { ChatHistory } from "@/components/ChatHistory";
import { Conversation } from "@/components/workbench/conversation.types";
import { TestChart } from "@/components/charts/TestChart";
import { ModelSelector } from "./ModelSelector";
import { LogitLensResponse } from "@/components/workbench/conversation.types";
import { ModeToggle } from "@/components/ModeToggle";
import { LogitLensModes } from "@/components/workbench/modes";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChartSelector } from "./ChartSelector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

type Layout = "1x1" | "1x2" | "2x2";

type ModelLoadStatus = 'loading' | 'success' | 'error';

export function Playground() {
    const [modelType, setModelType] = useState<"chat" | "base">("base");
    const [modelName, setModelName] = useState<string>("EleutherAI/gpt-j-6b");
    const [savedConversations, setSavedConversations] = useState<Conversation[]>([]);
    const [activeConversations, setActiveConversations] = useState<Conversation[]>([]);

    const [chartData, setChartData] = useState<LogitLensResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [selectedModes, setSelectedModes] = useState<(number | undefined)[]>([])
    const [layout, setLayout] = useState<Layout>("1x1")
    const [configuringPosition, setConfiguringPosition] = useState<number | null>(null)
    const [modelLoadStatus, setModelLoadStatus] = useState<ModelLoadStatus>('loading');

    const getLayoutGrid = () => {
        switch (layout) {
            case "1x1":
                return "grid-cols-1";
            case "1x2":
                return "grid-cols-2";
            case "2x2":
                return "grid-cols-2 grid-rows-2";
            default:
                return "grid-cols-1";
        }
    }

    const getBoxCount = () => {
        switch (layout) {
            case "1x1":
                return 1;
            case "1x2":
                return 2;
            case "2x2":
                return 4;
            default:
                return 1;
        }
    }

    const handleAddChart = (modeIndex: number) => {
        if (configuringPosition === null) return;

        setSelectedModes(prev => {
            const newModes = [...prev];
            newModes[configuringPosition] = modeIndex;
            return newModes;
        });
        setConfiguringPosition(null);
    }

    const isChartSelected = (modeIndex: number) => {
        return selectedModes.includes(modeIndex);
    }

    const handleRun = async () => {
        setIsLoading(true);
        setChartData(null);
        try {
            const response = await fetch('https://cadentj--nnsight-backend-fastapi-app.modal.run/api/lens', {
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

    const getStatusMessage = () => {
        if (modelLoadStatus === 'loading') {
            return (
                <div>
                    The backend is hosted as a deployment on <a href="https://modal.com" className="text-blue-500">Modal</a>.
                    We're starting up a container for your session.
                </div>
            );
        } else if (modelLoadStatus === 'success') {
            return (
                <div>
                    Some things might be slow, but they'll warm up soon enough!
                </div>
            );
        } else if (modelLoadStatus === 'error') {
            return (
                <div>
                    Could not connect to the backend. Reach out to Caden, he probably turned it off.
                </div>
            );
        }
    }

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

    const handleRemoveChart = (position: number) => {
        setSelectedModes(prev => {
            const newModes = [...prev];
            newModes[position] = undefined;
            return newModes;
        });
    }

    // Handler to update model load status based on boolean from child
    const handleModelLoadStatusUpdate = (success: boolean) => {
        setModelLoadStatus(success ? 'success' : 'error');
    };

    return (
        <div className="flex flex-col h-screen">
            <header className="border-b  px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img
                        src="/images/NSF.png"
                        alt="NSF Logo"
                        className="h-8"
                    />
                    <img
                        src="/images/NDIF.png"
                        alt="NDIF Logo"
                        className="h-8"
                    />
                </div>

                <nav className="flex gap-2 items-center">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="secondary"
                                className={cn({
                                    "animate-pulse": modelLoadStatus === 'loading'
                                })}
                                size="sm"
                            >
                                {/* {modelLoadStatus === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} */}
                                <div
                                    className={cn("text-white", {
                                        "text-yellow-500 hover:text-yellow-600 animate-pulse": modelLoadStatus === 'loading',
                                        "text-green-600 hover:text-green-700": modelLoadStatus === 'success',
                                        "text-destructive hover:text-destructive": modelLoadStatus === 'error',
                                    })}
                                >
                                    ●
                                </div>
                                {modelLoadStatus === 'loading' ? 'Connecting' : modelLoadStatus === 'success' ? 'Ready' : 'Error'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            {getStatusMessage()}
                        </PopoverContent>
                    </Popover>

                    <Button variant="ghost" onClick={() => window.open("https://nnsight.net", "_blank")} size="sm">NNsight</Button>
                    <ModeToggle />
                </nav>
            </header>

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
                        <h1 className="text-lg font-medium">Logit Lens</h1>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline" className="gap-2">
                                        <LayoutGrid size={16} />
                                        Layout
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => setLayout("1x1")}>
                                        1x1
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setLayout("1x2")}>
                                        1x2
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setLayout("2x2")}>
                                        2x2
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="ghost" size="sm" disabled={true}>
                                <Code size={16} />
                                Code
                            </Button>
                            <TooltipProvider>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="sm"
                                            onClick={handleRun}
                                            className={cn({
                                                "opacity-50": activeConversations.length === 0 || !selectedModes.some(mode => mode !== undefined)
                                            })}
                                        >
                                            <Play size={16} />
                                            Run
                                        </Button>
                                    </TooltipTrigger>
                                    {(activeConversations.length === 0 || !selectedModes.some(mode => mode !== undefined)) && (
                                        <TooltipContent side="bottom">
                                            <p>{activeConversations.length === 0 ? 'No conversations active' : 'No charts selected'}</p>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
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

                            <Workbench
                                conversations={activeConversations}
                                onUpdateConversation={handleUpdateConversation}
                                onSaveConversation={handleSaveConversation}
                                onDeleteConversation={handleDeleteConversation}
                                onIDChange={handleIDChange}
                            />
                        </div>

                        {/* Container for charts */}
                        <div className="flex-1 flex flex-col overflow-hidden custom-scrollbar bg-muted relative">
                            {/* Padded container for charts only */}
                            <div className="flex-1 overflow-auto p-4">
                                <div className={`grid ${getLayoutGrid()} gap-4 h-full`}>
                                    {Array.from({ length: getBoxCount() }).map((_, index) => (
                                        <div key={index} className="h-full relative">
                                            {selectedModes[index] !== undefined ? (
                                                <div className="h-full">
                                                    <button
                                                        onClick={() => handleRemoveChart(index)}
                                                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors z-10"
                                                    >
                                                        <X className="h-4 w-4 text-muted-foreground" />
                                                    </button>
                                                    <TestChart
                                                        title={LogitLensModes[selectedModes[index]!].name}
                                                        description={LogitLensModes[selectedModes[index]!].description}
                                                        data={chartData}
                                                        isLoading={isLoading}
                                                    />
                                                </div>
                                            ) : (
                                                <div
                                                    className="flex flex-col items-center justify-center h-full border border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/50 transition-colors"
                                                    onClick={() => {
                                                        setConfiguringPosition(index);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        <p className="text-sm font-medium text-muted-foreground">Add a chart</p>
                                                        <Plus className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Inline Chart Selector Overlay */}
                            {configuringPosition !== null && (
                                <ChartSelector
                                    setConfiguringPosition={setConfiguringPosition}
                                    isChartSelected={isChartSelected}
                                    handleAddChart={handleAddChart}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
