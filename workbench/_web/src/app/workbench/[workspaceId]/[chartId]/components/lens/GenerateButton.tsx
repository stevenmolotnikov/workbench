"use client";

import { generate } from "@/lib/api/modelsApi";
import { useWorkspace } from "@/stores/useWorkspace";
import { Prediction } from "@/types/models";
import { LensConfigData } from "@/types/lens";
import { useState } from "react";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import type { GenerationResponse } from "@/lib/api/modelsApi";

interface GenerateButtonProps {
    prompt: string,
    config: LensConfigData,
    setConfig: (config: LensConfigData) => void,
}

export default function GenerateButton({ prompt, config, setConfig }: GenerateButtonProps) {
    const [maxNewTokens, setMaxNewTokens] = useState(3);

    const { setTokenData } = useLensWorkspace();

    const handleGenerate = async () => {
        const response: GenerationResponse = await generate({
            prompt: prompt,
            max_new_tokens: maxNewTokens,
            model: config.model,
        });

        setTokenData(response.completion)
        setConfig({
            ...config,
            prompt: response.completion.map(token => token.text).join(""),
            prediction: response.last_token_prediction,
            token: {
                idx: response.completion.length - 1,
                id: response.completion[response.completion.length - 1].id,
                text: response.completion[response.completion.length - 1].text,
                targetIds: [],
            },
        });
    }

    return (
        <div className="flex items-center h-8 w-fit border rounded">
            <button className="rounded-l hover:bg-muted text-xs h-full w-fit px-2" onClick={handleGenerate}>
                Generate
            </button>
            <input
                type="number"
                className="rounded-r border-l h-full text-center placeholder:text-center w-10 bg-muted/50 text-xs"
                max={20}
                min={1}
                value={maxNewTokens}
                onChange={(e) => setMaxNewTokens(Number(e.target.value))}
            />
        </div>
    )
}