"use client";

import { useState } from "react";

import { Completion, Prediction } from "@/types/workspace";

import { Route, RouteOff, RotateCcw, Sparkle } from "lucide-react";
import { useConnection } from '../../hooks/useConnection';
import { Edges } from './Edge';
import { Button } from "../ui/button";

import { ConnectableTokenArea } from "@/components/connections/ConnectableTokenArea";
import { Textarea } from "@/components/ui/textarea";
import config from "@/lib/config";

interface PatchingWorkbenchProps {
    connectionsHook: ReturnType<typeof useConnection>;
    source: Completion;
    destination: Completion;
    setSource: (conv: Completion) => void;
    setDestination: (conv: Completion) => void;
}

export function PatchingWorkbench({ connectionsHook, source, destination, setSource, setDestination }: PatchingWorkbenchProps) {

    const defaultPrediction: Prediction = {
        id: "",
        indices: [],
        str_indices: []
    }

    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [sourcePrediction, setSourcePrediction] = useState<Prediction>(defaultPrediction);
    const [destinationPrediction, setDestinationPrediction] = useState<Prediction>(defaultPrediction);

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

    const runConversation = async () => {
        try {
            const response = await fetch(config.getApiUrl(config.endpoints.execute), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversations: [source, destination]
                }),
            });
            const data = await response.json();
            setSourcePrediction(data.results[0]);
            setDestinationPrediction(data.results[1]);
        } catch (error) {
            console.error('Error sending request:', error);
        } finally {
            console.log("Done");

        }
    };

    const tokenArea = (counterId: number, which: string, text: string, prediction: Prediction) => {
        return (
            <div className="flex flex-col h-full  bg-card p-4 rounded-md border">
                <div className="flex flex-row justify-between items-center pb-2">
                    <span className="text-xs"> {which}</span>
                    <span className="text-xs">
                        Prediction: {prediction.str_indices.length > 0 ? prediction.str_indices[0] : "N/A"}
                        ({prediction.indices.length > 0 ? prediction.indices[0] : ""})
                    </span>

                </div>

                <ConnectableTokenArea
                    text={text}
                    isConnecting={isConnecting}
                    connectionMouseDown={(e) => handleBoxMouseDown(e, counterId)}
                    connectionMouseUp={(e) => handleBoxMouseUp(e, counterId)}
                    counterId={counterId}
                    onTokenUnhighlight={removeConnection}
                />
            </div>
        )
    }

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

                <div className="flex flex-col p-4 gap-4  h-full">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-medium">Tokenized Text</h2>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={clearConnections}
                                size="icon"
                                className="w-8 h-8"
                                variant="outline"
                            >
                                <RotateCcw />
                            </Button>
                            <Button
                                onClick={() => setIsConnecting(!isConnecting)}
                                size="icon"
                                className="w-8 h-8"
                            >
                                {isConnecting ? <RouteOff /> : <Route />}
                            </Button>
                            <Button
                                onClick={runConversation}
                                size="icon"
                                className="w-8 h-8"
                            >
                                <Sparkle className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {tokenArea(0, "Source", source.prompt, sourcePrediction)}
                    {tokenArea(1, "Destination", destination.prompt, destinationPrediction)}

                </div>

            </div>
            

            <div className="flex flex-col p-4 gap-4 border-t h-1/2">
                <Textarea
                    value={source.prompt}
                    onChange={(e) => setSource(prev => ({ ...prev, prompt: e.target.value }))}
                    className="flex-1 resize-none h-full"
                    placeholder="Enter your prompt here..."
                />
                <Textarea
                    value={destination.prompt}
                    onChange={(e) => setDestination(prev => ({ ...prev, prompt: e.target.value }))}
                    className="flex-1 resize-none h-full"
                    placeholder="Enter your prompt here..."
                />
            </div>
        </div>
    )
}