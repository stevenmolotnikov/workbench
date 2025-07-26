"use client";

import { useState } from "react";

import {
    Route,
    RouteOff,
    RotateCcw,
    ALargeSmall,
    Play,
    ArrowUpDown,
} from "lucide-react";
import { Edges } from "./Edge";
import useEdges from "@/hooks/useEdges";
import { ConnectableTokenArea } from "./ConnectableTokenArea";
import { Textarea } from "@/components/ui/textarea";
import { useSelectedModel } from "@/stores/useSelectedModel";
import { ModelSelector } from "../ModelSelector";
import { usePatchingCompletions } from "@/stores/usePatchingCompletions";
import { usePatchingTokens } from "@/stores/usePatchingTokens";
import { useConnections } from "@/stores/useConnections";
import { batchTokenizeText } from "@/actions/tokenize";
import type { Connection, PatchingConfig } from "@/types/patching";
import type { HeatmapProps } from "@/components/charts/primatives/Heatmap";
import { JointPredictionDisplay } from "./JointPredictionDisplay";
import { cn } from "@/lib/utils";
import { PatchingSettings } from "./PatchingSettingsDropdown";
import { TooltipButton } from "../ui/tooltip-button";
import { toast } from "sonner";
import type { Token } from "@/types/tokenizer";
import config from "@/lib/config";


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
    const [notificationMessage, setNotificationMessage] = useState<string>("");
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
        sourceTokenData,
        destinationTokenData,
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

            const tokenData = await batchTokenizeText([source, destination], modelName);
            setSourceTokenData(tokenData[0]);
            setDestinationTokenData(tokenData[1]);
        } catch (err) {
            console.error("Error tokenizing text:", err);
        } finally {
            setTokenizerLoading(false);
            if (sourceTokenData || destinationTokenData) {
                setNotificationMessage("Predictions stale");
            }
        }
    };

    const validateConnections = (connections: Connection[], sourceTokenData: Token[], destinationTokenData: Token[]) => {

        // Assert that the connections are valid

        let sourceIdx = 0 
        let destIdx = 0

        for (const connection of connections) {
            const startIdx = connection.start.tokenIndices[0]
            const endIdx = connection.end.tokenIndices[0]
            
            const sourceDiff = startIdx - sourceIdx
            const destDiff = endIdx - destIdx

            if (sourceDiff !== destDiff) {
                console.error("Invalid connection: source and destination indices are not the same")
                return false;
            }

            sourceIdx = connection.start.tokenIndices[connection.start.tokenIndices.length - 1]
            destIdx = connection.end.tokenIndices[connection.end.tokenIndices.length - 1]
        }

        const sourceDiff = sourceTokenData.length - sourceIdx
        const destDiff = destinationTokenData.length - destIdx
        if (sourceDiff !== destDiff) {
            console.error("Invalid connection: source and destination indices are not the same")
            return false
        }

        return true
    }

    const handleRunPatching = async () => {
        const { connections } = useConnections.getState();
        const { source, destination } = usePatchingCompletions.getState();

        if (!correctToken) {
            toast.error("Please set a metric");
            return;
        }

        if (!sourceTokenData || !destinationTokenData) {
            toast.error("Source and destination token data must be set");
            return;
        }

        if (!validateConnections(connections, sourceTokenData, destinationTokenData)) {
            toast.error("Invalid connections");
            return;
        }

        setPatchingLoading(true);

        const request: PatchingConfig = {
            edits: connections,
            model: modelName,
            source: source,
            destination: destination,
            submodule: component as "blocks" | "attn" | "mlp" | "heads",
            correctId: correctToken.id,
            patchTokens: patchTokens,
            incorrectId: incorrectToken?.id,
        };

        try {
            const response = await fetch(config.getApiUrl(config.endpoints.patch), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) throw new Error(response.statusText);

            

            const data = await response.json();
            
            // Transform API response to match HeatmapData interface
            const heatmapData: HeatmapProps = {
                data: data.results,
                xTickLabels: data.colLabels,
                yTickLabels: data.rowLabels,
                chartIndex: 0,
            };
            
            setHeatmapData(heatmapData);
        } catch (err) {
            console.error("Error running patching:", err);
        } finally {
            setPatchingLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (tokenizeOnEnter && e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleTokenize();
        }
    };

    const handlePatchTokens = (value: boolean) => {
        setPatchTokens(value);
        if (!value) {
            setIsConnecting(false);
            clear();
        }
    }

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
                            setPatchTokens={handlePatchTokens}
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
                            <TooltipButton
                                onClick={clear}
                                size="icon"
                                className="w-8 h-8"
                                variant="outline"
                                tooltip="Clear tokens and connections"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </TooltipButton>
                            <TooltipButton
                                onClick={handleTokenize}
                                size="icon"
                                className="w-8 h-8"
                                variant="outline"
                                tooltip="Tokenize text"
                            >
                                <ALargeSmall className="w-4 h-4" />
                            </TooltipButton>
                            <TooltipButton
                                onClick={() => setIsConnecting(!isConnecting)}
                                size="icon"
                                className="w-8 h-8"
                                variant={isConnecting ? "default" : "outline"}
                                disabled={!patchTokens}
                                tooltip={isConnecting ? "Disable connecting" : "Enable connecting"}
                            >
                                {isConnecting ? (
                                    <RouteOff className="w-4 h-4" />
                                ) : (
                                    <Route className="w-4 h-4" />
                                )}
                            </TooltipButton>
                            <TooltipButton
                                onClick={() => handleRunPatching()}
                                size="icon"
                                className="w-8 h-8"
                                tooltip="Run patching"
                                disabled={!sourceTokenData || !destinationTokenData}
                            >
                                <Play className="w-4 h-4" />
                            </TooltipButton>
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
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium">Prompts</h2>
                    <TooltipButton variant="outline" size="icon" tooltip="Swap prompts" onClick={() => {
                        setSource(source);
                        setDestination(destination);
                        handleTokenize();
                    }}>
                        <ArrowUpDown className="w-4 h-4" />
                    </TooltipButton>
                </div>
                <div className="flex flex-col flex-1 relative">
                    <div className="text-xs font-medium absolute bottom-3 right-3.5 pointer-events-none">Source Prompt</div>
                    <Textarea
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setSelectedArea("source")}
                        onBlur={() => setSelectedArea(null)}
                        className="h-24"
                        placeholder="Enter your source prompt here..."
                    />
                </div>
                <div className="flex flex-col flex-1 relative">
                    <div className="text-xs font-medium absolute bottom-3 right-3.5 pointer-events-none">Destination Prompt</div>
                    <Textarea
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setSelectedArea("destination")}
                        onBlur={() => setSelectedArea(null)}
                        className="h-24"
                        placeholder="Enter your destination prompt here..."
                    />
                </div>

                <JointPredictionDisplay notificationMessage={notificationMessage} setNotificationMessage={setNotificationMessage} />
            </div>

        </div>
    );
}