"use client";

import { Trash, Save, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConversationBuilder } from "@/components/prompt-builders/ConversationBuilder";
import { SinglePromptBuilder } from "@/components/prompt-builders/SinglePromptBuilder";
import { Conversation } from "@/components/workbench/conversation.types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface WorkbenchProps {
    conversations: Conversation[];
    onUpdateConversation: (id: string, updates: Partial<Conversation>) => void;
    onSaveConversation: (id: string) => void;
    onDeleteConversation: (id: string) => void;
    onIDChange: (id: string, newID: string) => void;
}

export function Workbench({
    conversations,
    onUpdateConversation,
    onSaveConversation,
    onDeleteConversation,
    onIDChange,
}: WorkbenchProps) {
    const toggleConversation = (id: string, isExpanded: boolean) => {
        onUpdateConversation(id, { isExpanded: !isExpanded });
    };

    const handleContentUpdate = (id: string, updates: Partial<Conversation>) => {
        onUpdateConversation(id, updates);
    };

    const handleTokenSelection = (id: string, indices: number[]) => {
        onUpdateConversation(id, { selectedTokenIndices: indices });
    };

    const checkConversationContent = (conv: Conversation) => {
        if (conv.type === "chat") {
            // NOTE: Maybe more rigorous checks here
            return conv.messages.some(msg => msg.content.length > 0);
        } else {
            return conv.prompt.length > 0;
        }
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {conversations.map((conv) => (
                <Card key={conv.id} className="border overflow-hidden">
                    <div className=" px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                                <Input
                                    value={conv.name}
                                    onChange={(e) => handleContentUpdate(conv.id, { name: e.target.value })}
                                    className="border-none shadow-none px-1 py-0 font-bold"
                                    onBlur={(e) => onIDChange(conv.id, e.target.value)}
                                />
                                <span className="text-xs px-1">{conv.model}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onSaveConversation(conv.id)}
                            >
                                <Save size={16}/>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDeleteConversation(conv.id)}
                            >
                                <Trash size={16}/>
                            </Button>
                            <Button
                                size="icon"
                                onClick={() => toggleConversation(conv.id, conv.isExpanded)}
                                disabled={!checkConversationContent(conv)}
                            >
                                <Sparkle size={16}/>
                            </Button>
                        </div>
                    </div>

                    <div >
                        {conv.type === "chat" ? (
                            <ConversationBuilder
                                messages={conv.messages}
                                onMessagesChange={(msgs) => handleContentUpdate(conv.id, { messages: msgs })}
                                isExpanded={conv.isExpanded}
                                onTokenSelection={(indices) => handleTokenSelection(conv.id, indices)}
                                modelName={conv.model}
                            />
                        ) : (
                            <SinglePromptBuilder
                                prompt={conv.prompt}
                                onPromptChange={(p) => handleContentUpdate(conv.id, { prompt: p })}
                                isExpanded={conv.isExpanded}
                                onTokenSelection={(indices) => handleTokenSelection(conv.id, indices)}
                                modelName={conv.model}
                            />
                        )}
                    </div>
                </Card>
            ))}
            {conversations.length === 0 && (
                <p className="text-center py-4">No active conversations.</p>
            )}
        </div>
    );
} 