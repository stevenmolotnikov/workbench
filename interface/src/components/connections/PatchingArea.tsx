"use client";

import { useState } from "react";
import { SinglePromptBuilder } from "@/components/prompt-builders/SinglePromptBuilder";
import { Conversation } from "@/components/workbench/conversation.types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Trash, Sparkle } from "lucide-react";


interface PromptCardProps {
    conversation: Conversation;
    onPromptChange: (prompt: string) => void;
    onTokenSelection: (indices: number[]) => void;
    toggleExpanded: () => void;
}

function PromptCard({
    conversation,
    onPromptChange,
    onTokenSelection,
    toggleExpanded,
}: PromptCardProps) {
    return (
        <Card key={conversation.id} className="border overflow-hidden">
        <div className=" px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="flex flex-col">
                    Prompt A
                    <span className="text-xs px-1">{conversation.model}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    size="icon"
                    onClick={toggleExpanded}
                >
                    <Sparkle size={16} />
                </Button>
            </div>
        </div>

        <SinglePromptBuilder
            prompt={conversation.prompt}
            onPromptChange={onPromptChange}
            isExpanded={conversation.isExpanded}
            onTokenSelection={onTokenSelection}
            modelName={conversation.model}
        />

    </Card>
    );
}

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
    const [convTwo, setConvTwo] = useState<Conversation>({...defaultConv, id: "2"});

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <PromptCard 
                conversation={convOne} 
                onPromptChange={(prompt) => setConvOne(prev => ({ ...prev, prompt }))}
                onTokenSelection={(indices) => setConvOne(prev => ({ ...prev, selectedTokenIndices: indices }))}
                toggleExpanded={() => setConvOne(prev => ({ ...prev, isExpanded: !prev.isExpanded }))}
            />
            <PromptCard 
                conversation={convTwo} 
                onPromptChange={(prompt) => setConvTwo(prev => ({ ...prev, prompt }))}
                onTokenSelection={(indices) => setConvTwo(prev => ({ ...prev, selectedTokenIndices: indices }))}
                toggleExpanded={() => setConvTwo(prev => ({ ...prev, isExpanded: !prev.isExpanded }))}
            />
        </div>
    );
} 