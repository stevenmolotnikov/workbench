"use client";

import { Plus, Settings2 } from "lucide-react";
import { ModelSelector } from "@/components/ModelSelector";
import { CompletionSection } from "@/components/prompt-builders/CompletionSection";
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
    const { handleNewCompletion, activeCompletions } = useLensWorkspace();
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
                            disabled={isLoading || activeCompletions.length >= 5}
                            tooltip="Create a new completion"
                        >
                            <Plus size={16} />
                        </TooltipButton>

                        <DropdownMenuCheckboxes />
                    </div>
                </div>
            </div>
            <div className="flex-1 px-6 py-4 overflow-y-auto">
                {activeCompletions.map((compl, index) => (
                    <CompletionSection 
                        key={compl.id} 
                        compl={compl} 
                        index={index} 
                        isLast={index === activeCompletions.length - 1}
                    />
                ))}
                {activeCompletions.length === 0 && (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                            <p className="text-sm">No active completions</p>
                            <p className="text-xs mt-1">Click the + button to create one</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
