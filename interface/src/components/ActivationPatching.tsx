"use client";

import { useState } from "react";

import { ModelSelector } from "./ModelSelector";
import { PatchingWorkbench } from "@/components/connections/PatchingWorkbench";
import { LogitLensResponse } from "@/components/workbench/conversation.types";
import { Conversation } from "@/components/workbench/conversation.types";
import { ChatHistory } from "@/components/ChatHistory";

import { ChartSelector } from "@/components/charts/ChartSelector";
import { WorkbenchMode } from "./WorkbenchMode";
import { useConnection } from "@/hooks/useConnection";
import config from "@/lib/config";


import ComponentDropdown from "./ComponentDropdown";
import { Layout } from "@/types/layout";

type ModelLoadStatus = 'loading' | 'success' | 'error';
type WorkbenchMode = "logit-lens" | "activation-patching";

interface ActivationPatchingProps {
    modelLoadStatus: ModelLoadStatus;
    setModelLoadStatus: (status: ModelLoadStatus) => void;
    workbenchMode: WorkbenchMode;
    setWorkbenchMode: (mode: WorkbenchMode) => void;
}

export function ActivationPatching({ modelLoadStatus, setModelLoadStatus, workbenchMode, setWorkbenchMode }: ActivationPatchingProps) {
    const [modelType, setModelType] = useState<"chat" | "base">("base");
    const [modelName, setModelName] = useState<string>("EleutherAI/gpt-j-6b");


    const [chartData, setChartData] = useState<LogitLensResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Handler to update model load status based on boolean from child
    const handleModelLoadStatusUpdate = (success: boolean) => {
        setModelLoadStatus(success ? 'success' : 'error');
    };

    const defaultConversation: Conversation = {
        id: "1",
        type: "base",
        messages: [],
        isExpanded: true,
        model: "EleutherAI/gpt-j-6b",
        name: "Test",
        prompt: "",
        selectedTokenIndices: [],
    }



    const [source, setSource] = useState<Conversation>(defaultConversation);
    const [destination, setDestination] = useState<Conversation>({ ...defaultConversation, id: "2" });
    // const [position, setPosition] = useState("bottom");

    // const [patchTokens, setPatchTokens] = useState(false);
    const connectionsHook = useConnection();
    const [layout, setLayout] = useState<Layout>("1x1");

    const handleRun = async () => {
        setChartData(null);

        console.log(modelName);
        try {
            const response = await fetch(config.getApiUrl(config.endpoints.patch), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    connections: connectionsHook.connections,
                    model: modelName,
                    source: source,
                    destination: destination,
                    submodule: "blocks",
                    correct_id: 1,
                    incorrect_id: 2,
                    patch_tokens: true,
                }),
            });
            // const data: PatchResponse = await response.json();
            // setChartData(data);
        } catch (error) {
            console.error('Error sending request:', error);
            setChartData(null);
        } finally {
            console.log("Done");
        }
    };

    return (
        <div className="flex flex-1 min-h-0">
            {/* Left sidebar */}
            <div className="w-64 border-r ">
                <ChatHistory savedConversations={[]} onLoadConversation={() => { }} activeConversationIds={[]} />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                {/* Top bar within main content */}
                <WorkbenchMode setLayout={setLayout} workbenchMode={workbenchMode} setWorkbenchMode={setWorkbenchMode} handleRun={handleRun} />

                <div className="flex flex-1 min-h-0">
                    <div className="w-[40%] border-r flex flex-col">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-medium">Model</h2>
                                <div className="flex items-center gap-2">
                                    <ModelSelector
                                        modelName={modelName}
                                        setModelName={setModelName}
                                        setModelType={setModelType}
                                        setLoaded={handleModelLoadStatusUpdate}
                                    />
                                    <ComponentDropdown />



                                </div>

                            </div>
                        </div>

                        <PatchingWorkbench connectionsHook={connectionsHook} source={source} destination={destination} setSource={setSource} setDestination={setDestination} />
                    </div>

                    <ChartSelector layout={layout} chartData={chartData} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
}
