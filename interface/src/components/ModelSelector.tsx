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
import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { Model } from "./workbench/conversation.types";
import { cn } from "@/lib/utils";
import config from "@/lib/config";

interface ModelSelectorProps {
    modelName: string;
    setModelName: Dispatch<SetStateAction<string>>;
    setModelType: Dispatch<SetStateAction<"base" | "chat">>;
    setLoaded: (success: boolean) => void;
}

export function ModelSelector({ modelName, setModelName, setModelType, setLoaded }: ModelSelectorProps) {
    const [baseModels, setBaseModels] = useState<string[]>([]);
    const [chatModels, setChatModels] = useState<string[]>([]);

    useEffect(() => {
        fetchModels();
    }, []);

    const handleModelTypeChange = (value: string) => {
        setModelName(value);
        if (baseModels.includes(value)) {
            setModelType("base");
        } else if (chatModels.includes(value)) {
            setModelType("chat");
        }
    }

    const fetchModels = async () => {
        try {
            const response = await fetch(config.getApiUrl(config.endpoints.models));

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: Model[] = await response.json();

            console.log(data);

            // Extract base and chat models
            const baseModels = data
                .filter(model => model.type === "base")
                .map(model => model.name);

            const chatModels = data
                .filter(model => model.type === "chat")
                .map(model => model.name);

            // Update state with fetched models
            setBaseModels(baseModels);
            setChatModels(chatModels);

            // Set default model if current selection is invalid
            const allModels = [...baseModels, ...chatModels];
            if (!allModels.includes(modelName)) {
                const defaultModel = baseModels[0] || chatModels[0] || "";
                handleModelTypeChange(defaultModel);
            }

            setLoaded(true);
        } catch (error) {
            console.error("Error fetching models:", error);
            setLoaded(false);
        }
    }

    return (
        <Select value={modelName} onValueChange={handleModelTypeChange}>
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
