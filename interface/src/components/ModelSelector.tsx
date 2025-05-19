import * as React from "react"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useModelStore } from "@/stores/useModelStore";

export function ModelSelector() {
    const { 
        baseModels, 
        chatModels, 
        fetchModels,
        modelName,
        handleModelChange
    } = useModelStore();

    useEffect(() => {
        fetchModels();
    }, [fetchModels]);

    return (
        <Select value={modelName} onValueChange={handleModelChange}>
            <SelectTrigger className={cn("w-[220px]", {
                "animate-pulse": baseModels.length === 0 && chatModels.length === 0
            })}>
                <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
                {baseModels.length > 0 && (
                    <SelectGroup>
                        <SelectLabel>Base Models</SelectLabel>
                        {baseModels.map((model) => (
                            <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                    </SelectGroup>
                )}
                {chatModels.length > 0 && (
                    <SelectGroup>
                        <SelectLabel>Chat Models</SelectLabel>
                        {chatModels.map((model) => (
                            <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                    </SelectGroup>
                )}
                {(baseModels.length === 0 && chatModels.length === 0) && (
                    <SelectItem value="loading" disabled>Loading models...</SelectItem>
                )}
            </SelectContent>
        </Select>
    )
}
