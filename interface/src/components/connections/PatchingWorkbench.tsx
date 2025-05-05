"use client";

import { useState } from "react";

import { Conversation } from "../workbench/conversation.types";

import { Route, RouteOff, RotateCcw, Sparkle } from "lucide-react";
import { useConnection } from '../../hooks/useConnection';
import { Edges } from './Edge';
import { Button } from "../ui/button";

import { ConnectableTokenArea } from "@/components/connections/ConnectableTokenArea";
import { Textarea } from "@/components/ui/textarea";
import config from "@/lib/config";

interface PatchingWorkbenchProps {
    connectionsHook: ReturnType<typeof useConnection>;
    convOne: Conversation;
    convTwo: Conversation;
    setConvOne: (conv: Conversation) => void;
    setConvTwo: (conv: Conversation) => void;
}

interface Prediction {
    id: string;
    indices: number[];
    str_indices: string[];
}

export function PatchingWorkbench({ connectionsHook, convOne, convTwo, setConvOne, setConvTwo }: PatchingWorkbenchProps) {

    const defaultPrediction: Prediction = {
        id: "",
        indices: [],
        str_indices: []
    }

    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [convOnePrediction, setConvOnePrediction] = useState<Prediction>(defaultPrediction);
    const [convTwoPrediction, setConvTwoPrediction] = useState<Prediction>(defaultPrediction);

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
                    conversations: [convOne, convTwo]
                }),
            });
            const data = await response.json();
            setConvOnePrediction(data.results[0]);
            setConvTwoPrediction(data.results[1]);
        } catch (error) {
            console.error('Error sending request:', error);
        } finally {
            console.log("Done");

        }
    };

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

                <div className="flex flex-col p-4 h-full">
                    <div className="flex items-center justify-between pb-2">
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


                    <ConnectableTokenArea
                        text={convOne.prompt}
                        model={convOne.model}
                        isConnecting={isConnecting}
                        connectionMouseDown={(e) => handleBoxMouseDown(e, 0)}
                        connectionMouseUp={(e) => handleBoxMouseUp(e, 0)}
                        counterId={0}
                        onTokenUnhighlight={removeConnection}
                    />
                    <div className="flex flex-row justify-between items-center py-1 pb-3">
                        <span className="text-xs"> Source</span>
                        <span className="text-xs">
                            Prediction: {convOnePrediction.str_indices.length > 0 ? convOnePrediction.str_indices[0] : "N/A"} 
                            ({convOnePrediction.indices.length > 0 ? convOnePrediction.indices[0] : ""})
                        </span>
                    </div>



                    <ConnectableTokenArea
                        text={convTwo.prompt}
                        model={convTwo.model}
                        isConnecting={isConnecting}
                        connectionMouseDown={(e) => handleBoxMouseDown(e, 1)}
                        connectionMouseUp={(e) => handleBoxMouseUp(e, 1)}
                        counterId={1}
                        onTokenUnhighlight={removeConnection}
                    />
                    <div className="flex flex-row justify-between items-center py-1 pb-3">
                        <span className="text-xs"> Destination</span>
                        <span className="text-xs">
                            Prediction: {convTwoPrediction.str_indices.length > 0 ? convTwoPrediction.str_indices[0] : "N/A"} 
                            ({convTwoPrediction.indices.length > 0 ? convTwoPrediction.indices[0] : ""})
                        </span>
                    </div>

                </div>

            </div>
            <div className="flex flex-col p-4 gap-4 border-t h-1/2">
                <h2 className="text-sm font-medium flex items-center">Text Entry</h2>
                <Textarea
                    value={convOne.prompt}
                    onChange={(e) => setConvOne(prev => ({ ...prev, prompt: e.target.value }))}
                    className="flex-1 resize-none h-full"
                    placeholder="Enter your prompt here..."
                />
                <Textarea
                    value={convTwo.prompt}
                    onChange={(e) => setConvTwo(prev => ({ ...prev, prompt: e.target.value }))}
                    className="flex-1 resize-none h-full"
                    placeholder="Enter your prompt here..."
                />
            </div>
        </div>
    )
}