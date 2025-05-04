"use client";

import { Textarea } from "@/components/ui/textarea";
import { TokenArea } from "@/components/prompt-builders/TokenArea";

interface SinglePromptBuilderProps {
    prompt: string;
    onPromptChange: (prompt: string) => void;
    isExpanded: boolean;
    onTokenSelection?: (indices: number[]) => void;
    modelName: string;
}

export function SinglePromptBuilder({
    prompt,
    onPromptChange,
    isExpanded,
    onTokenSelection,
    modelName,
}: SinglePromptBuilderProps) {
    return (
        <div className="flex flex-col h-full">
            {isExpanded ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <Textarea
                        value={prompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        className="mt-1 h-48 resize-none"
                        placeholder="Enter your prompt here..."
                    />
                </div>
            ) : (
                <TokenArea text={!isExpanded ? prompt : null} model={modelName} onTokenSelection={onTokenSelection} />
            )}
        </div>
    );
} 