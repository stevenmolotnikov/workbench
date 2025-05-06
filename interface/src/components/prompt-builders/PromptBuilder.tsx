"use client";

import { useState } from "react";
import { Trash, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LensCompletion } from "@/types/lens";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TokenArea } from "@/components/prompt-builders/TokenArea";
import { TokenPredictions } from "@/types/workspace";
import config from "@/lib/config";

interface PromptBuilderProps {
    completions: LensCompletion[];
    onUpdateCompletion: (id: string, updates: Partial<LensCompletion>) => void;
    onDeleteCompletion: (id: string) => void;
}

export function PromptBuilder({
    completions,
    onUpdateCompletion,
    onDeleteCompletion,
}: PromptBuilderProps) {
    const handleContentUpdate = (id: string, updates: Partial<LensCompletion>) => {
        onUpdateCompletion(id, updates);
    };

    const [predictions, setPredictions] = useState<TokenPredictions | null>(null);

    const handleTokenSelection = (id: string, indices: number[]) => {
        onUpdateCompletion(id, { selectedTokenIndices: indices });
    };

    const runConversation = async (completion: LensCompletion) => {
        console.log(completion);
        try {
            const response = await fetch(config.getApiUrl(config.endpoints.executeSelected), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    completion: completion,
                    model: completion.model,
                    selected_token_indices: completion.selectedTokenIndices
                }),
            });
            const data: TokenPredictions = await response.json();
            setPredictions(data);
        } catch (error) {
            console.error('Error sending request:', error);
        } finally {
            console.log("Done");

        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {completions.map((compl) => (
                <Card key={compl.id} className="border p-4 overflow-hidden">
                    <div className="flex items-center pb-3 justify-between">
                        <div className="flex flex-col">
                            <Input
                                value={compl.name}
                                onChange={(e) => handleContentUpdate(compl.id, { name: e.target.value })}
                                className="border-none shadow-none px-1 py-0 font-bold"
                            />
                            <span className="text-xs px-1">{compl.model}</span>

                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDeleteCompletion(compl.id)}
                            >
                                <Trash size={16} />
                            </Button>
                            <Button
                                size="icon"
                                onClick={() => {runConversation(compl)}}
                            >
                                <Sparkle size={16} />
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col h-full gap-4">
                        <div className="flex-1 overflow-y-autospace-y-6">
                            <Textarea
                                value={compl.prompt}
                                onChange={(e) => handleContentUpdate(compl.id, { prompt: e.target.value })}
                                className="mt-1 h-48 resize-none"
                                placeholder="Enter your prompt here..."
                            />
                        </div>
                        <TokenArea 
                            text={compl.prompt} 
                            predictions={predictions || {}} 
                            onTokenSelection={(indices) => handleTokenSelection(compl.id, indices)} 
                        />
                    </div>
                </Card>
            ))}
            {completions.length === 0 && (
                <p className="text-center py-4">No active completions.</p>
            )}
        </div>
    );
} 