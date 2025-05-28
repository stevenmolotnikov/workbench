"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelSelector } from "@/components/ModelSelector";
import { CompletionCard } from "@/components/prompt-builders/CompletionCard";
import { useLensCompletions } from "@/stores/useLensCompletions";
import { useWorkbench } from "@/stores/useWorkbench";
import { useTour } from "@reactour/tour";

export function PromptBuilder() {
    const { handleNewCompletion, activeCompletions } = useLensCompletions();
    const { setCurrentStep, currentStep, isOpen } = useTour();

    const { modelName } = useWorkbench();

    function createNewCompletion() {
        handleNewCompletion(modelName);
        // TODO: mmaybe check if activeCompletions incremented instead
        if (isOpen) {
            setTimeout(() => {
                setCurrentStep(currentStep + 1);
            }, 250);
        }
    }

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
                            onClick={createNewCompletion}
                            id="new-completion"
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
