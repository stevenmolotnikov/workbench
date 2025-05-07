"use client";

import { useState } from "react";
import { Trash, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LensCompletion } from "@/types/lens";

import { Textarea } from "@/components/ui/textarea";
import { TokenArea } from "@/components/prompt-builders/TokenArea";
import { TokenPredictions } from "@/types/workspace";
import config from "@/lib/config";
import { cn } from "@/lib/utils";

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
    const [selectedToken, setSelectedToken] = useState<number | null>(null);
    const [showPredictions, setShowPredictions] = useState<boolean>(false);

    const handleTokenSelection = (id: string, indices: number[]) => {
        onUpdateCompletion(id, { selectedTokenIndices: indices });
    };

    const handleSparkleClick = async (completion: LensCompletion) => {
        if (showPredictions) {
            setShowPredictions(false);
        } else {
            await runConversation(completion);
        }
    }

    const runConversation = async (completion: LensCompletion) => {
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
            setShowPredictions(true);
        } catch (error) {
            console.error('Error sending request:', error);
        } finally {
            console.log("Done");
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {completions.map((compl) => (
                <div key={compl.id}>
                    <div className={cn("border bg-card p-4 overflow-hidden transition-all duration-200 ease-in-out", showPredictions ? "rounded-t-lg" : "rounded-lg")}>
                        <div className="flex items-center justify-between pb-4">
                            <span className="text-sm">{compl.model}</span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDeleteCompletion(compl.id)}
                                >
                                    <Trash size={16} className="w-8 h-8" />
                                </Button>
                                <Button
                                    size="icon"
                                    onClick={() => { handleSparkleClick(compl) }}
                                >
                                    <Sparkle size={16} className="w-8 h-8" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex flex-col h-full gap-4">
                            <div className="flex-1 overflow-y-autospace-y-6">
                                <Textarea
                                    value={compl.prompt}
                                    onChange={(e) => handleContentUpdate(compl.id, { prompt: e.target.value })}
                                    className="h-24 resize-none"
                                    placeholder="Enter your prompt here..."
                                />
                            </div>
                            <div className="flex flex-col h-24 w-full p-3 rounded-md border">
                                <TokenArea
                                    text={compl.prompt}
                                    showPredictions={showPredictions}
                                    predictions={predictions || {}}
                                    onTokenSelection={(indices) => handleTokenSelection(compl.id, indices)}
                                    setSelectedToken={setSelectedToken}
                                />
                            </div>
                        </div>
                    </div>
                    {
                        showPredictions && <div className="border-x border-b p-4 bg-card/30 rounded-b-lg transition-all duration-200 ease-in-out animate-in slide-in-from-top-2">
                            {predictions && selectedToken !== null && predictions[selectedToken] ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Target</span>
                                        <input
                                            className="bg-transparent border rounded w-1/4"
                                            placeholder=""
                                        />
                                    </div>
                                    {predictions[selectedToken].str_idxs.map((str: string, idx: number) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span>{str}</span>
                                            <span className="text-muted-foreground">
                                                {predictions[selectedToken].values[idx].toFixed(4)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">
                                    No token selected
                                </div>
                            )}
                        </div>
                    }
                </div>
            ))}
            {completions.length === 0 && (
                <p className="text-center py-4">No active completions.</p>
            )}
        </div>
    );
} 