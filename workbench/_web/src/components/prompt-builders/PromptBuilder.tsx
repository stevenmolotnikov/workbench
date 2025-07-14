"use client";

import { Plus, Settings2 } from "lucide-react";
import { ModelSelector } from "@/components/ModelSelector";
import { CompletionCard } from "@/components/prompt-builders/CompletionCard";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { useSelectedModel } from "@/stores/useSelectedModel";
import { useTutorialManager } from "@/hooks/useTutorialManager";
import { useModels } from "@/hooks/useModels";
import { TooltipButton } from "@/components/ui/tooltip-button";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DropdownMenuCheckboxes() {
    const { tokenizeOnEnter, graphOnTokenize, setTokenizeOnEnter, setGraphOnTokenize } = useLensWorkspace();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="icon">
                    <Settings2 size={16} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Completion Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                    checked={tokenizeOnEnter}
                    onCheckedChange={setTokenizeOnEnter}
                >
                    Tokenize on Enter
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={graphOnTokenize}
                    onCheckedChange={setGraphOnTokenize}
                >
                    Graph on Tokenize
                </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function PromptBuilder() {
    const { handleNewCompletion, completions } = useLensWorkspace();
    const { isLoading } = useModels();
    const { handleClick } = useTutorialManager();
    const { modelName } = useSelectedModel();

    function createNewCompletion() {
        handleNewCompletion(modelName);
        handleClick("#new-completion");
    }

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium">Model</h2>

                    <div className="flex items-center gap-2">
                        <ModelSelector />

                        <TooltipButton
                            size="icon"
                            // className="w-8 h-8"
                            onClick={createNewCompletion}
                            id="new-completion"
                            disabled={isLoading || completions.length >= 5}
                            tooltip="Create a new completion"
                        >
                            <Plus size={16} />
                        </TooltipButton>

                        <DropdownMenuCheckboxes />
                    </div>
                </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {completions.map((compl, index) => (
                    <CompletionCard key={compl.id} compl={compl} index={index} />
                ))}
                {completions.length === 0 && (
                    <p className="text-center py-4">No active completions.</p>
                )}
            </div>
        </div>
    );
}