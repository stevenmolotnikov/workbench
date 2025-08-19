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
import { useWorkspace } from "@/stores/useWorkspace";
import useModels from "@/hooks/useModels";

export function ModelSelector() {
    const { selectedModel, setSelectedModel } = useWorkspace();
    const { models, isLoading } = useModels();

    const baseModels = models.filter(model => model.type === "base").map(model => model.name);
    const chatModels = models.filter(model => model.type === "chat").map(model => model.name);

    const handleModelChange = (modelName: string) => {
        const model = models.find(model => model.name === modelName);
        if (model) {
            setSelectedModel(model);
        }
    };

    return (
        <Select value={selectedModel?.name} onValueChange={handleModelChange}>
            <SelectTrigger className={cn("w-fit gap-2", {
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
