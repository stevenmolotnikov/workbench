"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelSelector } from "@/components/ModelSelector";
import { CompletionCard } from "@/components/prompt-builders/CompletionCard";
import { useLensCompletions } from "@/stores/useLensCompletions";
import { useWorkbench } from "@/stores/useWorkbench";

export function PromptBuilder() {
    const { handleNewCompletion, activeCompletions } = useLensCompletions();

    const { modelName } = useWorkbench();

    return (
        <div>
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium">Model</h2>

                    <div className="flex items-center gap-2">
                        <ModelSelector />

                        <Button
                            size="sm"
                            className="w-100"
                            onClick={() => handleNewCompletion(modelName)}
                        >
                            New
                            <Plus size={16} />
                        </Button>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {activeCompletions.map((compl) => (
                    <CompletionCard key={compl.id} compl={compl} />
                ))}
                {activeCompletions.length === 0 && (
                    <p className="text-center py-4">No active completions.</p>
                )}
            </div>
        </div>
    );
}
