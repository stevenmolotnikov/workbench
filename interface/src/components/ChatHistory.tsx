"use client";

import { useState } from "react";
import { Plus, MessagesSquare, FileText, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Conversation } from "@/components/workbench/conversation.types";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatHistoryProps {
    savedConversations: Conversation[];
    onLoadConversation: (conversation: Conversation) => void;
    activeConversationIds?: string[];
}

export function ChatHistory({ 
    savedConversations, 
    onLoadConversation,
    activeConversationIds = []
}: ChatHistoryProps) {
    const [activeTab, setActiveTab] = useState<"saved" | "recent">("saved");

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b ">
                <div className="flex items-center gap-2 ">
                    <Button
                        variant={activeTab === "saved" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab("saved")}
                    >
                        Prompts
                    </Button>
                    <Button
                        variant={activeTab === "recent" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab("recent")}
                        disabled={true}
                    >
                        Workspaces
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === "saved" ? (
                    <div className="space-y-2">
                        {savedConversations.map((conv) => {
                            const isActive = activeConversationIds.includes(conv.id);
                            return (
                                <TooltipProvider key={conv.id}>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`p-3 border rounded cursor-pointer ${
                                                    isActive ? "opacity-50" : ""
                                                }`}
                                                onClick={() => onLoadConversation(conv)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {conv.type === "chat" ? (
                                                        <MessagesSquare size={16} />
                                                    ) : (
                                                        <FileText size={16}  />
                                                    )}
                                                    <div className="text-sm font-medium">{conv.id}</div>
                                                </div>
                                                <div className="text-xs mt-1">
                                                    {conv.type === "chat" ? "Chat" : "Prompt"} • {conv.messages.length} messages
                                                </div>
                                                <div className="text-xs mt-1 flex items-center gap-1">
                                                    <Bot size={12} />
                                                    {conv.model}
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        {isActive && (
                                            <TooltipContent side="right">
                                                <p>'{conv.id}' already in active conversations</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-sm  text-center py-8">
                        TBD
                    </div>
                )}
            </div>
        </div>
    );
} 