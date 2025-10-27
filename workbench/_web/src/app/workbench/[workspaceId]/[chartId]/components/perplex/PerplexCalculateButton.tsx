"use client";

import { Loader2, CornerDownLeft, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PerplexCalculateButtonProps {
    onCalculate: () => void;
    isCalculating: boolean;
    disabled: boolean;
    model: string;
    setModel: (model: string) => void;
    modelOptions: Array<{ value: string; label: string }>;
}

export default function PerplexCalculateButton({ 
    onCalculate, 
    isCalculating, 
    disabled,
    model,
    setModel,
    modelOptions
}: PerplexCalculateButtonProps) {
    return (
        <div className="flex items-center h-fit w-fit rounded">
            <button
                type="button"
                onClick={onCalculate}
                onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                disabled={disabled || isCalculating}
                className="rounded-l border items-center hover:bg-accent disabled:opacity-50 disabled:hover:bg-muted transition-all duration-100 bg-muted justify-center flex h-8 w-8"
            >
                {isCalculating ? (
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
                    <div className="flex items-center w-fit border h-auto rounded">
                        <div className="px-3 py-2 text-xs text-muted-foreground border-r whitespace-nowrap">Analysis Model</div>
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
                </PopoverContent>
            </Popover>
        </div>
    );
}

