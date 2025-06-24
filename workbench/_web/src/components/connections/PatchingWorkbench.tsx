"use client";

import { useState } from "react";

import {
    Route,
    RouteOff,
    RotateCcw,
    ALargeSmall,
    Snowflake,
    Eraser,
    Play,
    Settings2,
} from "lucide-react";
import { useConnection } from "../../hooks/useConnection";
import { Edges } from "./Edge";
import { Button } from "../ui/button";
import { ConnectableTokenArea } from "./ConnectableTokenArea";
import { Textarea } from "@/components/ui/textarea";
import { useSelectedModel } from "@/stores/useSelectedModel";
import { ModelSelector } from "../ModelSelector";
import { usePatchingCompletions } from "@/stores/usePatchingCompletions";
import { Token } from "@/types/tokenizer";
import { batchTokenizeText, decodeTokenIds } from "@/actions/tokenize";
import { ActivationPatchingRequest } from "@/types/patching";
import config from "@/lib/config";
import { HeatmapProps } from "@/components/charts/base/Heatmap";
import { JointPredictionDisplay } from "./JointPredictionDisplay";
import { TargetTokenBadge } from "./TargetTokenBadge";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function PatchingSettings({
    tokenizeOnEnter,
    setTokenizeOnEnter,
    component,
    setComponent,
    patchTokens,
    setPatchTokens,
}: {
    tokenizeOnEnter: boolean;
    setTokenizeOnEnter: (value: boolean) => void;
    component: string;
    setComponent: (value: string) => void;
    patchTokens: boolean;
    setPatchTokens: (value: boolean) => void;
}) {
    const handleComponentChange = (value: string) => {
        if (value === "head" && patchTokens) {
            // If selecting head while patch tokens is enabled, disable patch tokens
            setPatchTokens(false);
        }
        setComponent(value);
    };

    const handlePatchTokensChange = (value: boolean) => {
        if (value && component === "head") {
            // If enabling patch tokens while component is head, change component to blocks
            setComponent("blocks");
        }
        setPatchTokens(value);
    };
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="icon">
                    <Settings2 size={16} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
                <DropdownMenuLabel>Completion Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                    checked={tokenizeOnEnter}
                    onCheckedChange={setTokenizeOnEnter}
                >
                    Tokenize on Enter
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={patchTokens}
                    onCheckedChange={handlePatchTokensChange}
                >
                    Patch Tokens
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-2">
                    <div className="text-sm font-medium mb-2">Component</div>
                    <Select value={component} onValueChange={handleComponentChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="blocks">blocks</SelectItem>
                            <SelectItem value="heads">heads</SelectItem>
                            <SelectItem value="attn">attn</SelectItem>
                            <SelectItem value="mlp">mlp</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function PatchingWorkbench({ setHeatmapData }: { setHeatmapData: (data: HeatmapProps) => void }) {
    const [tokenizeOnEnter, setTokenizeOnEnter] = useState<boolean>(true);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [isFreezingTokens, setIsFreezingTokens] = useState<boolean>(false);
    const [isAblatingTokens, setIsAblatingTokens] = useState<boolean>(false);
    const [component, setComponent] = useState<string>("blocks");
    const [patchTokens, setPatchTokens] = useState<boolean>(false);
    const [metric, setMetric] = useState<string>("logit-difference");
    const { modelName } = useSelectedModel();
    const { 
        source, 
        destination, 
        targetTokens, 
        activeTokenType,
        setSource, 
        setDestination,
        setCorrectToken,
        setIncorrectToken,
        setActiveTokenType
    } = usePatchingCompletions();
    const [selectedArea, setSelectedArea] = useState<"source" | "destination" | null>(null);

    const [sourceTokenData, setSourceTokenData] = useState<Token[] | null>(null);
    const [destinationTokenData, setDestinationTokenData] = useState<Token[] | null>(null);
    const [tokenizerLoading, setTokenizerLoading] = useState<boolean>(false);

    // Prediction-related state
    const [predictions, setPredictions] = useState<{
        source: {
            ids: number[];
            values: number[];
        };
        destination: {
            ids: number[];
            values: number[];
        };
    } | null>(null);
    const [predictionLoading, setPredictionLoading] = useState(false);
    const [decodedSourceTokens, setDecodedSourceTokens] = useState<string[]>([]);
    const [decodedDestTokens, setDecodedDestTokens] = useState<string[]>([]);

    const connectionsHook = useConnection();

    const { handleBackgroundClick, clearConnections } = connectionsHook;

    const clear = () => {
        clearConnections();
    }

    const handleTokenize = async () => {
        try {
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

    const handleRunPredictions = async () => {
        if (!source.prompt.trim() || !destination.prompt.trim()) {
            return;
        }

        setPredictionLoading(true);
        try {
            const response = await fetch(config.getApiUrl(config.endpoints.executePair), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    source: source,
                    destination: destination,
                    model: modelName,
                    job_id: "prediction_job",
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setPredictions(data);

            // Decode the top 3 tokens for both source and destination
            const sourceTopIds = data.source.ids.slice(0, 3);
            const destTopIds = data.destination.ids.slice(0, 3);

            const [decodedSource, decodedDest] = await Promise.all([
                decodeTokenIds(sourceTopIds, modelName),
                decodeTokenIds(destTopIds, modelName),
            ]);

            setDecodedSourceTokens(decodedSource);
            setDecodedDestTokens(decodedDest);
        } catch (error) {
            console.error("Error running predictions:", error);
        } finally {
            setPredictionLoading(false);
        }
    };

    const handleRunPatching = async () => {
        const { connections, source, destination } = usePatchingCompletions.getState();

        const request: ActivationPatchingRequest = {
            edits: connections,
            model: modelName,
            source: source,
            destination: destination,
            submodule: component as "blocks" | "attn" | "mlp" | "heads",
            correctId: 0,
            patchTokens: patchTokens,
            incorrectId: 0,
            jobId: "123",
        };

        try {
            const response = await fetch(config.getApiUrl(config.endpoints.patch), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            });

            const data = await response.json();
            console.log(data);
            setHeatmapData(data);
        } catch (err) {
            console.error("Error running patching:", err);
        }
    };

    const handleModeToggle = (mode: "connect" | "freeze" | "ablate") => {
        switch (mode) {
            case "connect":
                setIsConnecting(!isConnecting);
                setIsFreezingTokens(false);
                setIsAblatingTokens(false);
                break;
            case "freeze":
                setIsFreezingTokens(!isFreezingTokens);
                setIsConnecting(false);
                setIsAblatingTokens(false);
                break;
            case "ablate":
                setIsAblatingTokens(!isAblatingTokens);
                setIsConnecting(false);
                setIsFreezingTokens(false);
                break;
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
                            {/* <Button
                                onClick={() => handleModeToggle("freeze")}
                                size="icon"
                                className="w-8 h-8"
                                variant={isFreezingTokens ? "default" : "outline"}
                                title={
                                    isFreezingTokens ? "Disable freeze mode" : "Enable freeze mode"
                                }
                            >
                                <Snowflake className="w-4 h-4" />
                            </Button>
                            <Button
                                onClick={() => handleModeToggle("ablate")}
                                size="icon"
                                className="w-8 h-8"
                                variant={isAblatingTokens ? "default" : "outline"}
                                title={
                                    isAblatingTokens ? "Disable ablate mode" : "Enable ablate mode"
                                }
                            >
                                <Eraser className="w-4 h-4" />
                            </Button> */}
                            <Button
                                onClick={() => handleModeToggle("connect")}
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
                                tokenData={sourceTokenData}
                                isConnecting={isConnecting}
                                isFreezingTokens={isFreezingTokens}
                                isAblatingTokens={isAblatingTokens}
                                useConnections={connectionsHook}
                                counterId={0}
                                tokenizerLoading={tokenizerLoading}
                            />
                        </div>

                        <div className={cn(
                            "flex flex-col w-full px-3 py-2 border rounded bg-card",
                            selectedArea === "destination" ? "border-blue-500" : ""
                        )}>
                            <ConnectableTokenArea
                                tokenData={destinationTokenData}
                                isConnecting={isConnecting}
                                isFreezingTokens={isFreezingTokens}
                                isAblatingTokens={isAblatingTokens}
                                useConnections={connectionsHook}
                                counterId={1}
                                tokenizerLoading={tokenizerLoading}
                            />
                        </div>

                        <div className="absolute inset-0 pointer-events-none">
                            <Edges useConnections={connectionsHook} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col p-4 gap-4 border-t h-1/2">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium">Prompts</h2>
                    <div className="flex items-center gap-2">

                        <Button
                            onClick={handleRunPredictions}
                            disabled={predictionLoading || !source.prompt.trim() || !destination.prompt.trim()}
                            className="w-8 h-8"
                            size="icon"
                        >
                            <Play className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
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

            </div>

            <div className="border-t p-4">
                <div className="flex items-center justify-between">

                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-medium">Metric</h2>
                        <Select value={metric} onValueChange={(value) => {
                            setMetric(value);
                            // Clear active token type when metric changes
                            setActiveTokenType(null);
                        }}>
                            <SelectTrigger className="w-fit h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="logit-difference">Logit Difference</SelectItem>
                                <SelectItem value="target-prob">Target Prob</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        {/* Target Token Badges */}
                        <div className="flex items-center gap-2 ml-2">
                            <TargetTokenBadge
                                label="Correct"
                                value={targetTokens.correct}
                                isActive={activeTokenType === 'correct'}
                                onClick={() => setActiveTokenType(activeTokenType === 'correct' ? null : 'correct')}
                            />
                            {metric === "logit-difference" && (
                                <TargetTokenBadge
                                    label="Incorrect"
                                    value={targetTokens.incorrect}
                                    isActive={activeTokenType === 'incorrect'}
                                    onClick={() => setActiveTokenType(activeTokenType === 'incorrect' ? null : 'incorrect')}
                                />
                            )}
                        </div>
                    </div>

                </div>
                <JointPredictionDisplay
                    modelName={modelName}
                    predictions={predictions}
                    decodedSourceTokens={decodedSourceTokens}
                    decodedDestTokens={decodedDestTokens}
                    activeTokenType={activeTokenType}
                />
            </div>

        </div>
    );
}
