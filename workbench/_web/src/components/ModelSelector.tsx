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
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getModels } from "@/lib/api/modelsApi";
import { useWorkspace } from "@/stores/useWorkspace";

export function ModelSelector() {
    const { selectedModel, setSelectedModel } = useWorkspace();

    const { data: models = [], isLoading, isSuccess } = useQuery({
        queryKey: ['models'],
        queryFn: getModels,
        refetchInterval: 120000,
    });

    const baseModels = models.filter(model => model.type === "base").map(model => model.name);
    const chatModels = models.filter(model => model.type === "chat").map(model => model.name);

    const handleModelChange = (modelName: string) => {
        const model = models.find(model => model.name === modelName);
        if (model) {
            setSelectedModel(model);
        }
    };

    useEffect(() => {
        if (isSuccess) {
            const defaultModel = models[0];
            setSelectedModel(defaultModel);
        }
    }, [isSuccess, models, setSelectedModel]);

    return (
        <Select value={selectedModel?.name} onValueChange={handleModelChange}>
            <SelectTrigger className={cn("w-[220px]", {
                "animate-pulse": isLoading
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
                {isLoading && (
                    <SelectItem value="loading" disabled>Loading models...</SelectItem>
                )}
            </SelectContent>
        </Select>
    )
}
