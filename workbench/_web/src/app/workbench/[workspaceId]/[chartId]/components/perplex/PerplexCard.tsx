"use client";

import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo } from "react";
import { PerplexConfig } from "@/db/schema";
import { PerplexConfigData, PerplexResults } from "@/types/perplex";
import config from "@/lib/config";
import { createUserHeadersAction } from "@/actions/auth";
import { toast } from "sonner";
import { setChartData } from "@/lib/queries/chartQueries";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useParams } from "next/navigation";
import { getModels } from "@/lib/api/modelsApi";
import { startAndPoll } from "@/lib/startAndPoll";
import PerplexGenerateButton from "./PerplexGenerateButton";
import PerplexCalculateButton from "./PerplexCalculateButton";

interface PerplexCardProps {
    initialConfig: PerplexConfig;
    selectedModel: string;
}

export function PerplexCard({ initialConfig, selectedModel }: PerplexCardProps) {
    const { chartId } = useParams<{ chartId: string }>();
    const queryClient = useQueryClient();
    const [promptText, setPromptText] = useState(initialConfig.data.prompt || "");
    const [outputText, setOutputText] = useState(initialConfig.data.output || "");
    const [isCalculating, setIsCalculating] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState(false);
    const [editingOutput, setEditingOutput] = useState(false);
    
    // Generation settings
    const [generationModel, setGenerationModel] = useState(selectedModel);
    const [maxTokens, setMaxTokens] = useState(50);
    const [temperature, setTemperature] = useState(1.0);
    
    // Analysis settings
    const [analysisModel, setAnalysisModel] = useState(selectedModel);

    const { data: models } = useQuery({
        queryKey: ['models'],
        queryFn: getModels,
        refetchInterval: 120000,
    });

    const modelOptions = useMemo(() => {
        return models?.map(m => ({ value: m.name, label: m.name })) || [];
    }, [models]);

    const handleGenerate = async () => {
        if (!promptText.trim()) {
            toast.error("Prompt is required for generation");
            return;
        }

        setIsGenerating(true);
        try {
            const headers = await createUserHeadersAction();
            
            // Use the existing generation endpoint
            const result = await startAndPoll<any>(
                config.endpoints.startGenerate,
                {
                    model: generationModel,
                    prompt: promptText,
                    max_new_tokens: maxTokens,
                    temperature: temperature,
                },
                config.endpoints.resultsGenerate,
                headers
            );

            // Extract the generated text from the completion tokens
            // The completion array should contain ONLY newly generated tokens (not prompt)
            const generatedText = result.completion.map((token: any) => token.text).join('');
            
            // Only set the output to the newly generated text
            setOutputText(generatedText);
            
            toast.success("Generation complete");
        } catch (error) {
            console.error("Error generating text:", error);
            toast.error("Failed to generate text");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCalculate = async () => {
        if (!promptText.trim() || !outputText.trim()) {
            toast.error("Both prompt and output are required");
            return;
        }

        setIsCalculating(true);
        try {
            const headers = await createUserHeadersAction();
            const response = await fetch(config.getApiUrl(config.endpoints.perplexCalculate), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...headers,
                },
                body: JSON.stringify({
                    model: analysisModel,
                    prompt: promptText,
                    output: outputText,
                    top_k: 3,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to calculate probabilities");
            }

            const data = await response.json();
            
            // Save results to chart data
            await setChartData(chartId, data.data, "perplex");
            
            // Invalidate chart query to refresh display
            queryClient.invalidateQueries({
                queryKey: queryKeys.charts.chart(chartId),
            });
            
            toast.success("Probabilities calculated successfully");
        } catch (error) {
            console.error("Error calculating probabilities:", error);
            toast.error("Failed to calculate probabilities");
        } finally {
            setIsCalculating(false);
        }
    };

    return (
        <div className="flex flex-col w-full gap-3">
            {/* Prompt Section */}
            <div className="flex flex-col size-full relative">
                <Textarea
                    id="prompt"
                    placeholder="Enter prompt to generate text for analysis."
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    onFocus={() => setEditingPrompt(true)}
                    onBlur={(e) => {
                        const currentTarget = e.currentTarget;
                        setTimeout(() => {
                            const activeElement = document.activeElement;
                            const withinPrompt = currentTarget.contains(activeElement);
                            const popoverOpen = document.querySelector('[data-radix-popper-content-wrapper]');
                            
                            if (withinPrompt || popoverOpen) return;
                            
                            setEditingPrompt(false);
                        }, 0);
                    }}
                    rows={2}
                    className="w-full !text-sm bg-input/30 !leading-5 resize-y"
                />
                
                {editingPrompt && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        <PerplexGenerateButton
                            onGenerate={handleGenerate}
                            isGenerating={isGenerating}
                            disabled={isCalculating || !promptText.trim()}
                            model={generationModel}
                            setModel={setGenerationModel}
                            maxTokens={maxTokens}
                            setMaxTokens={setMaxTokens}
                            temperature={temperature}
                            setTemperature={setTemperature}
                            modelOptions={modelOptions}
                        />
                    </div>
                )}
            </div>

            {/* Output Section */}
            <div className="flex flex-col size-full relative">
                <Textarea
                    id="output"
                    placeholder="Enter text for analysis."
                    value={outputText}
                    onChange={(e) => setOutputText(e.target.value)}
                    onFocus={() => setEditingOutput(true)}
                    onBlur={(e) => {
                        const currentTarget = e.currentTarget;
                        setTimeout(() => {
                            const activeElement = document.activeElement;
                            const withinOutput = currentTarget.contains(activeElement);
                            const popoverOpen = document.querySelector('[data-radix-popper-content-wrapper]');
                            
                            if (withinOutput || popoverOpen) return;
                            
                            setEditingOutput(false);
                        }, 0);
                    }}
                    className="w-full !text-sm bg-input/30 min-h-48 !leading-5 resize-y"
                />
                
                {editingOutput && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        <PerplexCalculateButton
                            onCalculate={handleCalculate}
                            isCalculating={isCalculating}
                            disabled={isGenerating || !promptText.trim() || !outputText.trim()}
                            model={analysisModel}
                            setModel={setAnalysisModel}
                            modelOptions={modelOptions}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

