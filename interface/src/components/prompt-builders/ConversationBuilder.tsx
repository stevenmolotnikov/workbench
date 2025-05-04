"use client";

import { Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TokenArea } from "@/components/prompt-builders/TokenArea";
import { Message } from "@/components/workbench/conversation.types";

interface ConversationBuilderProps {
    messages: Message[];
    onMessagesChange: (messages: Message[]) => void;
    isExpanded: boolean;
    onTokenSelection?: (indices: number[]) => void;
    modelName: string;
}

export function ConversationBuilder({
    messages,
    onMessagesChange,
    isExpanded,
    onTokenSelection,
    modelName,
}: ConversationBuilderProps) {
    const addMessage = () => {
        const lastMessage = messages[messages.length - 1];
        const nextRole = lastMessage?.role === "user" ? "assistant" : "user";
        onMessagesChange([...messages, { role: nextRole, content: "" }]);
    };

    const handleMessageChange = (index: number, content: string) => {
        const updatedMessages = [...messages];
        updatedMessages[index].content = content;
        onMessagesChange(updatedMessages);
    };

    const deleteMessage = (index: number) => {
        console.log('deleting message', index);
        const updatedMessages = [...messages];
        updatedMessages.splice(index, 1);
        onMessagesChange(updatedMessages);
    };

    // Only create chat array when needed for tokenization
    const tokenCounterContent = !isExpanded ? messages : null;

    return (
        <div className="flex flex-col h-full">
            {isExpanded ? (

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div>
                        <div className="space-y-2 mt-2">
                            {messages.map((message, index) => (
                                <div key={`message-${message.role}-${index}`} className="border  rounded-md overflow-hidden">
                                    <div className="px-3 py-1.5 flex items-center justify-between">
                                        <span className="text-sm font-medium">{message.role === "user" ? "User" : "Assistant"}</span>
                                        {message.role === "user" && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMessage(index)}>
                                                <Trash size={14} />
                                            </Button>
                                        )}
                                    </div>
                                    <Textarea
                                        value={message.content}
                                        onChange={(e) => handleMessageChange(index, e.target.value)}
                                        placeholder={message.role === "user" ? "Empty user message" : "Empty assistant message"}
                                        className=" border-0 h-20 resize-none focus-visible:ring-0"
                                    />
                                </div>
                            ))}

                            <Button size="sm" variant="outline" className="w-full mt-2" onClick={addMessage}>
                                <Plus size={14} className="mr-1" />
                                Add message
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <TokenArea text={tokenCounterContent} model={modelName} onTokenSelection={onTokenSelection} />
            )}
        </div>
    );
} 