"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { PerplexResults } from "@/types/perplex";
import { RefObject, useState } from "react";
import { useCreateLensChartPair } from "@/lib/api/chartApi";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

interface PerplexDisplayProps {
    results: PerplexResults;
    captureRef: RefObject<HTMLDivElement>;
    prompt: string;
    output: string;
    model: string;
}

type HighlightMode = "probability" | "rank";

export function PerplexDisplay({ results, captureRef, prompt, output, model }: PerplexDisplayProps) {
    const [highlightMode, setHighlightMode] = useState<HighlightMode>("probability");
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const router = useRouter();
    const { mutate: createLensChartPair, isPending: isCreatingLens } = useCreateLensChartPair();

    // Calculate min/max values from output tokens only (for color scaling)
    const minProb = Math.min(...results.output_tokens.map(t => t.probability));
    const maxProb = Math.max(...results.output_tokens.map(t => t.probability));
    const minRank = Math.min(...results.output_tokens.map(t => t.rank));
    const maxRank = Math.max(...results.output_tokens.map(t => t.rank));

    const getColorForProb = (probability: number): string => {
        // Map probability relative to min/max in data
        const range = maxProb - minProb;
        const normalized = range > 0 ? (probability - minProb) / range : 0.5;
        const hue = 120 * normalized; // 0° = red, 120° = green
        return `hsl(${hue.toFixed(1)}, 70%, 60%)`;
    };

    const getColorForRank = (rank: number): string => {
        // Use logarithmic scale for ranks, relative to data range
        if (minRank === maxRank) {
            // All tokens have same rank, use neutral color
            return `hsl(60, 70%, 60%)`;
        }
        const minLog = Math.log(minRank);
        const maxLog = Math.log(maxRank);
        const rankLog = Math.log(rank);
        const normalized = 1 - (rankLog - minLog) / (maxLog - minLog); // Invert so rank 1 is green
        const hue = 120 * normalized;
        return `hsl(${hue.toFixed(1)}, 70%, 60%)`;
    };

    const getColor = (tokenData: { probability: number; rank: number }): string => {
        if (highlightMode === "probability") {
            return getColorForProb(tokenData.probability);
        } else {
            return getColorForRank(tokenData.rank);
        }
    };

    const formatToken = (token: string): string => {
        // Make whitespace visible
        if (token === ' ') return '·';
        if (token === '\n') return '↵';
        if (token === '\t') return '→';
        return token;
    };

    const handleTokenClick = (tokenIndex: number, isPromptToken: boolean) => {
        if (isCreatingLens) return;

        // Reconstruct the prompt up to (but NOT including) the clicked token
        // This shows what the model was predicting when it chose this token
        let targetPrompt = "";
        
        if (isPromptToken) {
            // Clicked a prompt token - use all prompt tokens BEFORE this one
            targetPrompt = results.prompt_tokens.slice(0, tokenIndex).map(t => t.token).join('');
        } else {
            // Clicked an output token - need FULL original prompt + output tokens BEFORE this one
            // Reconstruct the full prompt from prompt_tokens to ensure accuracy
            const fullPrompt = results.prompt_tokens.map(t => t.token).join('');
            const outputBefore = results.output_tokens.slice(0, tokenIndex).map(t => t.token).join('');
            targetPrompt = fullPrompt + outputBefore;
        }

        // Don't allow empty prompts
        if (!targetPrompt.trim()) {
            toast.error("Cannot analyze first token (no context)");
            return;
        }

        console.log('Creating lens with prompt:', targetPrompt);
        console.log('For token at index:', tokenIndex, 'isPromptToken:', isPromptToken);

        // Create a new lens chart with this prompt
        createLensChartPair({
            workspaceId: workspaceId as string,
            config: {
                prompt: targetPrompt,
                model: model,
                token: { idx: 0, id: 0, text: "", targetIds: [] },
            }
        }, {
            onSuccess: ({ chart }) => {
                toast.success("Created lens chart");
                // Navigate to the new chart with auto-tokenize flag
                router.push(`/workbench/${workspaceId}/${chart.id}?autoTokenize=true`);
            },
            onError: () => {
                toast.error("Failed to create lens chart");
            }
        });
    };

    const renderTokenSection = (tokens: typeof results.prompt_tokens, title: string, description: string, isPromptSection: boolean) => (
        <div className="border rounded-lg p-4 bg-card">
            <div className="mb-3">
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <TooltipProvider>
                <div className="flex flex-wrap gap-2 leading-relaxed">
                    {tokens.map((tokenData, idx) => (
                        <Tooltip key={idx} delayDuration={200}>
                            <TooltipTrigger asChild>
                                <div
                                    className="inline-flex items-center px-2.5 py-1.5 rounded text-sm font-mono cursor-pointer hover:ring-2 hover:ring-primary transition-all shadow-sm"
                                    style={{ 
                                        backgroundColor: getColor(tokenData),
                                        color: (highlightMode === "probability" ? tokenData.probability < (minProb + maxProb) / 2 : tokenData.rank > (minRank + maxRank) / 2) ? '#fff' : '#000'
                                    }}
                                    onClick={() => handleTokenClick(idx, isPromptSection)}
                                >
                                    {formatToken(tokenData.token)}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent 
                                className="bg-popover border-border px-3 py-2.5" 
                                side="top"
                                sideOffset={8}
                            >
                                <div className="space-y-2 min-w-[200px]">
                                    <div className="flex items-center justify-between gap-6 pb-2 border-b border-border/50">
                                        <span className="font-mono font-semibold text-base">{formatToken(tokenData.token)}</span>
                                        <div className="flex gap-3 text-xs tabular-nums">
                                            <div className="text-right">
                                                <div className="text-muted-foreground/70 text-[10px] uppercase tracking-wide">prob</div>
                                                <div className="font-mono">{(tokenData.probability * 100).toFixed(1)}%</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-muted-foreground/70 text-[10px] uppercase tracking-wide">rank</div>
                                                <div className="font-mono">#{tokenData.rank}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        {tokenData.top_alternatives.map((alt, i) => {
                                            const isActualToken = formatToken(alt.token) === formatToken(tokenData.token);
                                            return (
                                                <div 
                                                    key={i} 
                                                    className={`flex items-center justify-between gap-4 py-0.5 text-xs ${isActualToken ? 'font-semibold' : 'text-muted-foreground/80'}`}
                                                >
                                                    <span className="font-mono">
                                                        <span className="text-muted-foreground/50">{i + 1}.</span> {formatToken(alt.token)}
                                                    </span>
                                                    <span className="font-mono tabular-nums">
                                                        {(alt.probability * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            </TooltipProvider>
        </div>
    );

    return (
        <div ref={captureRef} className="flex flex-col size-full p-6 overflow-auto">
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                    <div>
                        <h2 className="text-lg font-semibold">Token Probability Analysis</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Hover over tokens to see detailed statistics
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-muted-foreground">
                            Vocab Size: {results.vocab_size.toLocaleString()}
                        </div>
                        <div className="flex gap-1 border rounded-md p-1">
                            <Button
                                size="sm"
                                variant={highlightMode === "probability" ? "default" : "ghost"}
                                onClick={() => setHighlightMode("probability")}
                                className="h-7 px-3 text-xs"
                            >
                                Probability
                            </Button>
                            <Button
                                size="sm"
                                variant={highlightMode === "rank" ? "default" : "ghost"}
                                onClick={() => setHighlightMode("rank")}
                                className="h-7 px-3 text-xs"
                            >
                                Rank
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="text-sm font-medium">Color Scale (relative to data):</div>
                        {highlightMode === "probability" ? (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: getColorForProb(minProb) }} />
                                    <span>{(minProb * 100).toFixed(2)}% (Lowest)</span>
                                </div>
                                <span>→</span>
                                <div className="flex items-center gap-1">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: getColorForProb(maxProb) }} />
                                    <span>{(maxProb * 100).toFixed(2)}% (Highest)</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: getColorForRank(minRank) }} />
                                    <span>Rank #{minRank.toLocaleString()} (Best)</span>
                                </div>
                                <span>→</span>
                                <div className="flex items-center gap-1">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: getColorForRank(maxRank) }} />
                                    <span>Rank #{maxRank.toLocaleString()} (Worst)</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {results.prompt_tokens.length > 0 && renderTokenSection(
                        results.prompt_tokens,
                        "Prompt Tokens",
                        "How the model predicted each token in your input prompt (click to open in lens)",
                        true
                    )}

                    {renderTokenSection(
                        results.output_tokens,
                        "Output Tokens",
                        "How the model predicted each token in the generated output (click to open in lens)",
                        false
                    )}
                </div>
            </div>
        </div>
    );
}
