"use client";

import { useState } from "react";
import { Conversation } from "@/components/workbench/conversation.types";
import { ConnectableTokenCounter } from "@/components/connections/ConnectableTokenCounter";
import { Textarea } from "@/components/ui/textarea";


export function PatchingArea() {

    const defaultConv: Conversation = {
        id: "1",
        type: "base",
        messages: [],
        isExpanded: true,
        model: "EleutherAI/gpt-j-6b",
        name: "Test",
        prompt: "Hello, world!",
        selectedTokenIndices: [],
    }

    const [convOne, setConvOne] = useState<Conversation>(defaultConv);
    const [convTwo, setConvTwo] = useState<Conversation>({ ...defaultConv, id: "2" });


    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar">

            <ConnectableTokenCounter
                convOne={convOne}
                convTwo={convTwo}
                onTokenSelectionOne={(indices) => setConvOne(prev => ({ ...prev, selectedTokenIndices: indices }))}
                onTokenSelectionTwo={(indices) => setConvTwo(prev => ({ ...prev, selectedTokenIndices: indices }))}
            />


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
    );
} 