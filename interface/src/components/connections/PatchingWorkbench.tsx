"use client";

import { useState } from "react";

import { Route, RouteOff, RotateCcw, ALargeSmall, Snowflake, Eraser } from "lucide-react";
import { useConnection } from "../../hooks/useConnection";
import { Edges } from "./Edge";
import { Button } from "../ui/button";
import { ConnectableTokenArea } from "./ConnectableTokenArea";
import { Textarea } from "@/components/ui/textarea";
import { useSelectedModel } from "@/stores/useSelectedModel";
import { ModelSelector } from "../ModelSelector";
import { usePatchingCompletions } from "@/stores/usePatchingCompletions";
import { Token } from "@/types/tokenizer";
import { batchTokenizeText } from "@/actions/tokenize";

export function PatchingWorkbench() {
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [isFreezingTokens, setIsFreezingTokens] = useState<boolean>(false);
    const [isAblatingTokens, setIsAblatingTokens] = useState<boolean>(false);
    const { modelName } = useSelectedModel();
    const { source, destination, setSource, setDestination } = usePatchingCompletions();

    const [sourceTokenData, setSourceTokenData] = useState<Token[] | null>(null);
    const [destinationTokenData, setDestinationTokenData] = useState<Token[] | null>(null);
    const [tokenizerLoading, setTokenizerLoading] = useState<boolean>(false);

    const connectionsHook = useConnection();

    const { handleBackgroundClick, clearConnections } = connectionsHook;

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

    const handleModeToggle = (mode: 'connect' | 'freeze' | 'ablate') => {
        switch (mode) {
            case 'connect':
                setIsConnecting(!isConnecting);
                setIsFreezingTokens(false);
                setIsAblatingTokens(false);
                break;
            case 'freeze':
                setIsFreezingTokens(!isFreezingTokens);
                setIsConnecting(false);
                setIsAblatingTokens(false);
                break;
            case 'ablate':
                setIsAblatingTokens(!isAblatingTokens);
                setIsConnecting(false);
                setIsFreezingTokens(false);
                break;
        }
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium">Model</h2>

                    <ModelSelector />
                </div>
            </div>

            <div className="h-1/2" onClick={handleBackgroundClick}>
                <div className="flex flex-col p-4 gap-4 h-full">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-medium">Patching</h2>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={clearConnections}
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
                                onClick={() => handleModeToggle('freeze')}
                                size="icon"
                                className="w-8 h-8"
                                variant={isFreezingTokens ? "default" : "outline"}
                                title={isFreezingTokens ? "Disable freeze mode" : "Enable freeze mode"}
                            >
                                <Snowflake className="w-4 h-4" />
                            </Button>
                            <Button
                                onClick={() => handleModeToggle('ablate')}
                                size="icon"
                                className="w-8 h-8"
                                variant={isAblatingTokens ? "default" : "outline"}
                                title={isAblatingTokens ? "Disable ablate mode" : "Enable ablate mode"}
                            >
                                <Eraser className="w-4 h-4" />
                            </Button>
                            <Button
                                onClick={() => handleModeToggle('connect')}
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
                        </div>
                    </div>

                    <div className="relative h-full w-full flex flex-col gap-4">
                        <div className="flex flex-col w-full px-3 py-2 border rounded">
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

                        <div className="flex flex-col w-full px-3 py-2 border rounded">
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

                        <div className="absolute inset-0 pointer-events-none">
                            <Edges useConnections={connectionsHook} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col p-4 gap-4 border-t h-1/2">
                <Textarea
                    value={source.prompt}
                    onChange={(e) => setSource({ ...source, prompt: e.target.value })}
                    className="flex-1 resize-none h-full"
                    placeholder="Enter your prompt here..."
                />
                <Textarea
                    value={destination.prompt}
                    onChange={(e) => setDestination({ ...destination, prompt: e.target.value })}
                    className="flex-1 resize-none h-full"
                    placeholder="Enter your prompt here..."
                />
            </div>
        </div>
    );
}
