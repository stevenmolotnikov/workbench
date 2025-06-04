"use client";

import { useState, useCallback } from "react";

import { Prediction } from "@/types/workspace";
import { PatchingCompletion } from "@/types/patching";

import { Route, RouteOff, RotateCcw, Sparkle, ALargeSmall } from "lucide-react";
import { useConnection } from '../../hooks/useConnection';
import { useTokenization } from '../../hooks/useTokenization';
import { Edges } from './Edge';
import { Button } from "../ui/button";
import { TokenAreaWithPrediction } from "./TokenAreaWithPrediction";
import { Textarea } from "@/components/ui/textarea";
import config from "@/lib/config";
import { useSelectedModel } from "@/hooks/useSelectedModel";

interface PatchingWorkbenchProps {
    connectionsHook: ReturnType<typeof useConnection>;
    source: PatchingCompletion;
    destination: PatchingCompletion;
    setSource: (conv: PatchingCompletion) => void;
    setDestination: (conv: PatchingCompletion) => void;
}

export function PatchingWorkbench({ connectionsHook, source, destination, setSource, setDestination }: PatchingWorkbenchProps) {
    const defaultPrediction: Prediction = { id: "", indices: [], str_indices: [] };

    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [sourcePrediction, setSourcePrediction] = useState<Prediction>(defaultPrediction);
    const [destinationPrediction, setDestinationPrediction] = useState<Prediction>(defaultPrediction);
    
    const { modelName } = useSelectedModel();
    const {
        sourceTokenData,
        destinationTokenData, 
        isTokenizing,
        tokenError,
        handleTokenize: baseHandleTokenize,
        updateTokens
    } = useTokenization();

    const {
        connections,
        isDragging,
        currentConnection,
        selectedEdgeIndex,
        svgRef,
        handleBoxMouseDown,
        handleBoxMouseUp,
        handleEdgeSelect,
        handleBackgroundClick,
        removeConnection,
        clearConnections,
    } = connectionsHook;

    const handleTokenize = useCallback(async () => {
        if (!modelName) return;
        await baseHandleTokenize(modelName, source, destination);
        updateTokens(sourceTokenData, destinationTokenData, setSource, setDestination, source, destination);
    }, [modelName, source, destination, baseHandleTokenize, updateTokens, sourceTokenData, destinationTokenData, setSource, setDestination]);

    const runConversation = async () => {
        try {
            const response = await fetch(config.getApiUrl(config.endpoints.execute), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversations: [source, destination] }),
            });
            const data = await response.json();
            setSourcePrediction(data.results[0]);
            setDestinationPrediction(data.results[1]);
        } catch (error) {
            console.error('Error sending request:', error);
        }
    };

    const handleTokenSelection = useCallback((indices: number[], completion: PatchingCompletion, setter: (comp: PatchingCompletion) => void) => {
        if (indices.length === 1 && indices[0] === -1) {
            setter({
                ...completion,
                tokens: completion.tokens.map(t => ({ ...t, highlighted: false }))
            });
        } else {
            const updatedTokens = completion.tokens.map(token => ({
                ...token,
                highlighted: indices.includes(token.idx)
            }));
            
            const existingIndices = completion.tokens.map(t => t.idx);
            const newTokens = indices.filter(idx => !existingIndices.includes(idx))
                .map(idx => ({ idx, highlighted: true }));
            
            setter({
                ...completion,
                tokens: [...updatedTokens, ...newTokens]
            });
        }
    }, []);

    const shouldEnableTokenize = !isTokenizing && modelName && (source.prompt || destination.prompt);

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="relative h-1/2" onClick={handleBackgroundClick}>
                <div className="absolute inset-0 pointer-events-none" >
                    <Edges
                        connections={connections}
                        isDragging={isDragging}
                        currentConnection={currentConnection}
                        svgRef={svgRef}
                        onEdgeSelect={handleEdgeSelect}
                        selectedEdgeIndex={selectedEdgeIndex}
                    />
                </div>

                <div className="flex flex-col p-4 gap-4 h-full">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-medium">Tokenized Text</h2>
                        <div className="flex items-center gap-2">
                            <Button onClick={clearConnections} size="icon" className="w-8 h-8" variant="outline" title="Clear connections">
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button onClick={handleTokenize} size="icon" className="w-8 h-8" variant="outline" disabled={!shouldEnableTokenize} title="Tokenize text">
                                <ALargeSmall className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => setIsConnecting(!isConnecting)} size="icon" className="w-8 h-8" title={isConnecting ? "Disable connecting" : "Enable connecting"}>
                                {isConnecting ? <RouteOff className="w-4 h-4" /> : <Route className="w-4 h-4" />}
                            </Button>
                            <Button onClick={runConversation} size="icon" className="w-8 h-8" title="Run prediction">
                                <Sparkle className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {tokenError && <div className="text-red-500 text-sm">{tokenError}</div>}

                    <TokenAreaWithPrediction
                        counterId={0}
                        title="Source"
                        text={source.prompt}
                        prediction={sourcePrediction}
                        tokenData={sourceTokenData}
                        completion={source}
                        setter={setSource}
                        isConnecting={isConnecting}
                        connectionMouseDown={(e) => handleBoxMouseDown(e, 0)}
                        connectionMouseUp={(e) => handleBoxMouseUp(e, 0)}
                        onTokenUnhighlight={removeConnection}
                        isTokenizing={isTokenizing}
                        tokenError={tokenError}
                        onTokenSelection={(indices) => handleTokenSelection(indices, source, setSource)}
                    />
                    
                    <TokenAreaWithPrediction
                        counterId={1}
                        title="Destination"
                        text={destination.prompt}
                        prediction={destinationPrediction}
                        tokenData={destinationTokenData}
                        completion={destination}
                        setter={setDestination}
                        isConnecting={isConnecting}
                        connectionMouseDown={(e) => handleBoxMouseDown(e, 1)}
                        connectionMouseUp={(e) => handleBoxMouseUp(e, 1)}
                        onTokenUnhighlight={removeConnection}
                        isTokenizing={isTokenizing}
                        tokenError={tokenError}
                        onTokenSelection={(indices) => handleTokenSelection(indices, destination, setDestination)}
                    />
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