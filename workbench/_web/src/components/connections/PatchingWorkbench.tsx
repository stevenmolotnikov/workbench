"use client";

import { useState } from "react";

import {
    Route,
    RouteOff,
    RotateCcw,
    ALargeSmall,
    Play,
} from "lucide-react";
import { Edges } from "./Edge";
import useEdges from "@/hooks/useEdges";
import { Button } from "../ui/button";
import { ConnectableTokenArea } from "./ConnectableTokenArea";
import { Textarea } from "@/components/ui/textarea";
import { useSelectedModel } from "@/stores/useSelectedModel";
import { ModelSelector } from "../ModelSelector";
import { usePatchingCompletions } from "@/stores/usePatchingCompletions";
import { usePatchingTokens } from "@/stores/usePatchingTokens";
import { useConnections } from "@/stores/useConnections";
import { Token } from "@/types/tokenizer";
import { batchTokenizeText } from "@/actions/tokenize";
import type { ActivationPatchingRequest } from "@/types/patching";
import type { HeatmapProps } from "@/components/charts/base/Heatmap";
import { JointPredictionDisplay } from "./JointPredictionDisplay";
import { cn } from "@/lib/utils";
import { PatchingSettings } from "./PatchingSettingsDropdown";
import { useStatusUpdates } from "@/hooks/useStatusUpdates";

// Generate a unique ID for the job
const generateJobId = (): string => {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
};

export function PatchingWorkbench({ 
    setHeatmapData, 
    setPatchingLoading 
}: { 
    setHeatmapData: (data: HeatmapProps) => void;
    setPatchingLoading: (loading: boolean) => void;
}) {
    const [tokenizeOnEnter, setTokenizeOnEnter] = useState<boolean>(true);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [component, setComponent] = useState<string>("blocks");
    const [patchTokens, setPatchTokens] = useState<boolean>(false);
    const { modelName } = useSelectedModel();
    const {
        source,
        destination,
        correctToken,
        incorrectToken,
        setSource,
        setDestination,
    } = usePatchingCompletions();
    const [selectedArea, setSelectedArea] = useState<"source" | "destination" | null>(null);
    const [tokenizerLoading, setTokenizerLoading] = useState<boolean>(false);

    const {
        setSourceTokenData,
        setDestinationTokenData,
        clearHighlightedTokens,
    } = usePatchingTokens();

    const { 
        setSelectedEdgeIndex, 
        clearConnections,
    } = useConnections();

    const handleBackgroundClick = () => {
        setSelectedEdgeIndex(null);
    }

    const clear = () => {
        clearConnections();
        clearHighlightedTokens();
    }

    const { svgRef } = useEdges();

    const handleTokenize = async () => {
        try {
            clear();
            setTokenizerLoading(true);

            const inputTexts = [source.prompt, destination.prompt];
            const tokenData = await batchTokenizeText(inputTexts, modelName);
            setSourceTokenData(tokenData[0]);
            setDestinationTokenData(tokenData[1]);
        } catch (err) {
            console.error("Error tokenizing text:", err);
        } finally {
            setTokenizerLoading(false);
        }
    };

    const handleRunPatching = async () => {
        const { connections } = useConnections.getState();
        const { source, destination } = usePatchingCompletions.getState();

        if (!correctToken) {
            console.error("Correct and incorrect tokens must be set");
            return;
        }

        setPatchingLoading(true);
        const { startStatusUpdates, stopStatusUpdates } = useStatusUpdates.getState();
        const jobId = generateJobId();
        
        startStatusUpdates(jobId);

        const request: ActivationPatchingRequest = {
            edits: connections,
            model: modelName,
            source: source,
            destination: destination,
            submodule: component as "blocks" | "attn" | "mlp" | "heads",
            correctId: correctToken.id,
            patchTokens: patchTokens,
            incorrectId: incorrectToken?.id,
            jobId: jobId,
        };

        try {
            const response = await fetch("/api/patch-grid", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) throw new Error(response.statusText);

            const data = await response.json();
            setHeatmapData(data);
        } catch (err) {
            console.error("Error running patching:", err);
        } finally {
            setPatchingLoading(false);
            stopStatusUpdates();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (tokenizeOnEnter && e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleTokenize();
        }
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium">Patching Settings</h2>

                    <div className="flex items-center gap-2">
                        <ModelSelector />
                        <PatchingSettings
                            tokenizeOnEnter={tokenizeOnEnter}
                            setTokenizeOnEnter={setTokenizeOnEnter}
                            component={component}
                            setComponent={setComponent}
                            patchTokens={patchTokens}
                            setPatchTokens={setPatchTokens}
                        />
                    </div>
                </div>
                <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                        <span >Component</span>
                        <span className="font-medium ">{component}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span >Patch Tokens</span>
                        <span className={`font-medium ${patchTokens ? "text-green-600" : "text-gray-400"}`}>
                            {patchTokens ? "enabled" : "disabled"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="h-1/2" onClick={handleBackgroundClick}>
                <div className="flex flex-col p-4 gap-4 h-full">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-medium">Patching</h2>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={clear}
                                size="icon"
                                className="w-8 h-8"
                                variant="outline"
                                title="Clear connections"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button
                                onClick={handleTokenize}
                                size="icon"
                                className="w-8 h-8"
                                variant="outline"
                                title="Tokenize text"
                            >
                                <ALargeSmall className="w-4 h-4" />
                            </Button>
                            <Button
                                onClick={() => setIsConnecting(!isConnecting)}
                                size="icon"
                                className="w-8 h-8"
                                variant={isConnecting ? "default" : "outline"}
                                title={isConnecting ? "Disable connecting" : "Enable connecting"}
                            >
                                {isConnecting ? (
                                    <RouteOff className="w-4 h-4" />
                                ) : (
                                    <Route className="w-4 h-4" />
                                )}
                            </Button>
                            <Button
                                onClick={() => handleRunPatching()}
                                size="icon"
                                className="w-8 h-8"
                            >
                                <Play className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="relative h-full w-full flex flex-col gap-4">
                        <div className={cn(
                            "flex flex-col w-full px-3 py-2 border rounded bg-card",
                            selectedArea === "source" ? "border-blue-500" : ""
                        )}>
                            <ConnectableTokenArea
                                isConnecting={isConnecting}
                                svgRef={svgRef}
                                counterId={0}
                                tokenizerLoading={tokenizerLoading}
                            />
                        </div>

                        <div className={cn(
                            "flex flex-col w-full px-3 py-2 border rounded bg-card",
                            selectedArea === "destination" ? "border-blue-500" : ""
                        )}>
                            <ConnectableTokenArea
                                isConnecting={isConnecting}
                                svgRef={svgRef}
                                counterId={1}
                                tokenizerLoading={tokenizerLoading}
                            />
                        </div>

                        <div className="absolute inset-0 pointer-events-none">
                            <Edges svgRef={svgRef} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col p-4 gap-4 border-t h-1/2">
                <h2 className="text-sm font-medium">Prompts</h2>
                <div className="flex flex-col flex-1 relative">
                    <div className="text-xs font-medium absolute bottom-3 right-3.5 pointer-events-none">Source Prompt</div>
                    <Textarea
                        value={source.prompt}
                        onChange={(e) => setSource({ ...source, prompt: e.target.value })}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setSelectedArea("source")}
                        onBlur={() => setSelectedArea(null)}
                        className="flex-1 resize-none h-full"
                        placeholder="Enter your source prompt here..."
                    />
                </div>
                <div className="flex flex-col flex-1 relative">
                    <div className="text-xs font-medium absolute bottom-3 right-3.5 pointer-events-none">Destination Prompt</div>
                    <Textarea
                        value={destination.prompt}
                        onChange={(e) => setDestination({ ...destination, prompt: e.target.value })}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setSelectedArea("destination")}
                        onBlur={() => setSelectedArea(null)}
                        className="flex-1 resize-none h-full"
                        placeholder="Enter your destination prompt here..."
                    />
                </div>

                <JointPredictionDisplay/>
            </div>

        </div>
    );
}