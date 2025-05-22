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
import { PredictionDisplay } from "@/components/prompt-builders/PredictionDisplay";
import { useLensCompletions } from "@/stores/useLensCompletions";

interface PromptBuilderProps {
    completions: LensCompletion[];
}

export function PromptBuilder({ completions }: PromptBuilderProps) {
    const { handleUpdateCompletion, handleDeleteCompletion } = useLensCompletions();
    const handleContentUpdate = (id: string, updates: Partial<LensCompletion>) => {
        handleUpdateCompletion(id, updates);
    };

    const [predictions, setPredictions] = useState<TokenPredictions | null>(null);
    const [seletectedIdx, setSelectedIdx] = useState<number>(-1);
    const [showPredictions, setShowPredictions] = useState<boolean>(false);

    const handleTokenSelection = (id: string, indices: number[]) => {
        handleUpdateCompletion(id, {
            tokens: indices.map((idx) => ({
                target_id: -1,
                idx: idx,
            })),
        });
    };

    const updateToken = (id: string, tokenIdx: number, targetId: number, targetText: string) => {
        handleUpdateCompletion(id, {
            tokens:
                completions
                    .find((c) => c.id === id)
                    ?.tokens.map((t) =>
                        t.idx === tokenIdx
                            ? { ...t, target_id: targetId, target_text: targetText }
                            : t
                    ) || [],
        });
    };

    const clearToken = (id: string, tokenIdx: number) => {
        handleUpdateCompletion(id, {
            tokens:
                completions
                    .find((c) => c.id === id)
                    ?.tokens.map((t) =>
                        t.idx === tokenIdx ? { ...t, target_id: -1, target_text: "" } : t
                    ) || [],
        });
    };

    const handleSparkleClick = async (completion: LensCompletion) => {
        if (showPredictions) {
            setShowPredictions(false);
        } else {
            await runConversation(completion);
        }
    };

    const runConversation = async (completion: LensCompletion) => {
        console.log(
            JSON.stringify({
                completion: completion,
                model: completion.model,
                tokens: completion.tokens,
            })
        );

        try {
            const response = await fetch(config.getApiUrl(config.endpoints.executeSelected), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    completion: completion,
                    model: completion.model,
                    tokens: completion.tokens,
                }),
            });
            const data: TokenPredictions = await response.json();
            setPredictions(data);
            setShowPredictions(true);
        } catch (error) {
            console.error("Error sending request:", error);
        } finally {
            console.log("Done");
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {completions.map((compl) => (
                <div key={compl.id}>
                    <div
                        className={cn(
                            "border bg-card p-4 overflow-hidden transition-all duration-200 ease-in-out",
                            showPredictions ? "rounded-t-lg" : "rounded-lg"
                        )}
                    >
                        <div className="flex items-center justify-between pb-4">
                            <span className="text-sm">{compl.model}</span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteCompletion(compl.id)}
                                >
                                    <Trash size={16} className="w-8 h-8" />
                                </Button>
                                <Button
                                    size="icon"
                                    onClick={() => {
                                        handleSparkleClick(compl);
                                    }}
                                >
                                    <Sparkle size={16} className="w-8 h-8" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex flex-col h-full gap-4">
                            <div className="flex-1 overflow-y-autospace-y-6">
                                <Textarea
                                    value={compl.prompt}
                                    onChange={(e) =>
                                        handleContentUpdate(compl.id, { prompt: e.target.value })
                                    }
                                    className="h-24 resize-none"
                                    placeholder="Enter your prompt here..."
                                />
                            </div>
                            <div className="flex flex-col h-24 w-full p-3 rounded-md border">
                                <TokenArea
                                    text={compl.prompt}
                                    showPredictions={showPredictions}
                                    predictions={predictions || {}}
                                    onTokenSelection={(indices) =>
                                        handleTokenSelection(compl.id, indices)
                                    }
                                    setSelectedIdx={setSelectedIdx}
                                    filledTokens={compl.tokens}
                                />
                            </div>
                        </div>
                    </div>
                    {showPredictions && (
                        <PredictionDisplay
                            predictions={predictions || {}}
                            compl={compl}
                            selectedIdx={seletectedIdx}
                            updateToken={updateToken}
                            clearToken={clearToken}
                        />
                    )}
                </div>
            ))}
            {completions.length === 0 && <p className="text-center py-4">No active completions.</p>}
        </div>
    );
}
