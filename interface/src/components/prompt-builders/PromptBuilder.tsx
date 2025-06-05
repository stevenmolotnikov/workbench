"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelSelector } from "@/components/ModelSelector";
import { CompletionCard } from "@/components/prompt-builders/CompletionCard";
import { useLensCompletions } from "@/stores/useLensCompletions";
import { useSelectedModel } from "@/hooks/useSelectedModel";
import { useTutorialManager } from "@/hooks/useTutorialManager";
import { useModels } from "@/hooks/useModels";

export function PromptBuilder() {
    const { handleNewCompletion, activeCompletions } = useLensCompletions();
    const { isLoading } = useModels();
    const { handleClick } = useTutorialManager();
    const { modelName } = useSelectedModel();

    function createNewCompletion() {
        handleNewCompletion(modelName);
        handleClick('#new-completion');
    }

    return (
        <div className="overflow-y-visible">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium">Model</h2>

                    <div className="flex items-center gap-2">
                        <ModelSelector />

                        <Button
                            size="icon"
                            // className="w-8 h-8"
                            onClick={createNewCompletion}
                            id="new-completion"
                            disabled={isLoading}
                        >
                            <Plus size={16} />
                        </Button>
                    </div>
                </div>
            </div>
            <div className="flex-1 p-4 space-y-4 overflow-y-visible">
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
