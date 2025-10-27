"use client";

import { Loader2, CornerDownLeft, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PerplexGenerateButtonProps {
    onGenerate: () => void;
    isGenerating: boolean;
    disabled: boolean;
    model: string;
    setModel: (model: string) => void;
    maxTokens: number;
    setMaxTokens: (tokens: number) => void;
    temperature: number;
    setTemperature: (temp: number) => void;
    modelOptions: Array<{ value: string; label: string }>;
}

export default function PerplexGenerateButton({ 
    onGenerate, 
    isGenerating, 
    disabled,
    model,
    setModel,
    maxTokens,
    setMaxTokens,
    temperature,
    setTemperature,
    modelOptions
}: PerplexGenerateButtonProps) {
    return (
        <div className="flex items-center h-fit w-fit rounded">
            <button
                type="button"
                onClick={onGenerate}
                onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                disabled={disabled || isGenerating}
                className="rounded-l border items-center hover:bg-accent disabled:opacity-50 disabled:hover:bg-muted transition-all duration-100 bg-muted justify-center flex h-8 w-8"
            >
                {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <CornerDownLeft className="w-4 h-4" />
                )}
            </button>
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        className="rounded-l-none rounded-r border-r hover:bg-accent transition-all duration-100 border-y bg-muted h-8 w-4 flex items-center justify-center"
                    >
                        <ChevronDown className="w-3 h-3" />
                    </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-fit p-0 border-none">
                    <div className="flex flex-col w-fit border h-auto rounded overflow-hidden">
                        <div className="flex items-center border-b">
                            <div className="px-3 py-2 text-xs text-muted-foreground border-r w-24 whitespace-nowrap">Model</div>
                            <Select value={model} onValueChange={setModel}>
                                <SelectTrigger className="h-auto border-0 rounded-none text-xs px-3 py-2 w-48">
                                    <SelectValue className="truncate" />
                                </SelectTrigger>
                                <SelectContent>
                                    {modelOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center border-b">
                            <div className="px-3 py-2 text-xs text-muted-foreground border-r w-24 whitespace-nowrap">Max Tokens</div>
                            <input
                                type="number"
                                min="1"
                                max="500"
                                value={maxTokens}
                                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 50)}
                                className="focus:outline-none h-full text-left px-3 py-2 bg-transparent text-xs w-48 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                        <div className="flex items-center">
                            <div className="px-3 py-2 text-xs text-muted-foreground border-r w-24 whitespace-nowrap">Temperature</div>
                            <input
                                type="number"
                                min="0"
                                max="2"
                                step="0.1"
                                value={temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value) || 1.0)}
                                className="focus:outline-none h-full text-left px-3 py-2 bg-transparent text-xs w-48 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

