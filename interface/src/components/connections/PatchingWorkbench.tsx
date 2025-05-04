"use client";

import { useState } from "react";

import { Conversation } from "../workbench/conversation.types";

import { Route, RouteOff } from "lucide-react";
import { useConnection } from '../../hooks/useConnection';
import { Edges } from './Edge';
import { Button } from "../ui/button";

import { ConnectableTokenArea } from "@/components/connections/ConnectableTokenArea";
import { Textarea } from "@/components/ui/textarea";


export function PatchingWorkbench() {

    const defaultConversation: Conversation = {
        id: "1",
        type: "base",
        messages: [],
        isExpanded: true,
        model: "EleutherAI/gpt-j-6b",
        name: "Test",
        prompt: "",
        selectedTokenIndices: [],
    }

    const [convOne, setConvOne] = useState<Conversation>(defaultConversation);
    const [convTwo, setConvTwo] = useState<Conversation>({ ...defaultConversation, id: "2" });

    const [isConnecting, setIsConnecting] = useState(false);
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
    } = useConnection();

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="relative " onClick={handleBackgroundClick}>
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

                <div className="flex flex-col p-4 gap-4">
                    <ConnectableTokenArea
                        text={convOne.prompt}
                        model={convOne.model}
                        isConnecting={isConnecting}
                        connectionMouseDown={(e) => handleBoxMouseDown(e, 0)}
                        connectionMouseUp={(e) => handleBoxMouseUp(e, 0)}
                        counterId={0}
                        onTokenUnhighlight={removeConnection}
                    />
                    <ConnectableTokenArea
                        text={convTwo.prompt}
                        model={convTwo.model}
                        isConnecting={isConnecting}
                        connectionMouseDown={(e) => handleBoxMouseDown(e, 1)}
                        connectionMouseUp={(e) => handleBoxMouseUp(e, 1)}
                        counterId={1}
                        onTokenUnhighlight={removeConnection}
                    />
                    <div className="flex justify-end">
                        <Button
                            onClick={() => setIsConnecting(!isConnecting)}
                            size="icon"
                        >
                            {isConnecting ? <RouteOff /> : <Route />}
                        </Button>
                    </div>
                </div>

            </div>
            <div className="flex flex-col p-4 gap-4 border-t">
                <Textarea
                    value={convOne.prompt}
                    onChange={(e) => setConvOne(prev => ({ ...prev, prompt: e.target.value }))}
                    className="h-32 resize-none"
                    placeholder="Enter your prompt here..."
                />
                <Textarea
                    value={convTwo.prompt}
                    onChange={(e) => setConvTwo(prev => ({ ...prev, prompt: e.target.value }))}
                    className="h-32 resize-none"
                    placeholder="Enter your prompt here..."
                />
            </div>
        </div>
    )
}