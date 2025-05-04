"use client";

import { useState } from "react";
import {
    Code,
    Play,
    Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelSelector } from "./ModelSelector";
import { PatchingWorkbench } from "@/components/connections/PatchingWorkbench";
import { LogitLensResponse } from "@/components/workbench/conversation.types";

import { ChartSelector } from "@/components/charts/ChartSelector";
import { WorkbenchMode } from "./WorkbenchMode";

type ModelLoadStatus = 'loading' | 'success' | 'error';
type WorkbenchMode = "logit-lens" | "activation-patching";

interface LogitLensProps {
    modelLoadStatus: ModelLoadStatus;
    setModelLoadStatus: (status: ModelLoadStatus) => void;  
    workbenchMode: WorkbenchMode;
    setWorkbenchMode: (mode: WorkbenchMode) => void;
}

export function ActivationPatching({modelLoadStatus, setModelLoadStatus, workbenchMode, setWorkbenchMode}: LogitLensProps) {
    const [modelType, setModelType] = useState<"chat" | "base">("base");
    const [modelName, setModelName] = useState<string>("EleutherAI/gpt-j-6b");

    const [chartData, setChartData] = useState<LogitLensResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Handler to update model load status based on boolean from child
    const handleModelLoadStatusUpdate = (success: boolean) => {
        setModelLoadStatus(success ? 'success' : 'error');
    };

    return (

        <div className="flex flex-1 min-h-0">
            {/* Left sidebar */}
            <div className="w-64 border-r ">
                
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                {/* Top bar within main content */}
                <div className="p-4 border-b flex items-center justify-between">
                    <WorkbenchMode workbenchMode={workbenchMode} setWorkbenchMode={setWorkbenchMode} />
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" disabled={true}>
                            <Code size={16} />
                            Code
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => console.log("Run")}
                        >
                            <Play size={16} />
                            Run
                        </Button>
                    </div>
                </div>

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
                                </div>
                            </div>
                        </div>

                        <PatchingWorkbench />
                    </div>

                    {/* Container for charts */}
                    <ChartSelector chartData={chartData} isLoading={isLoading} />
                </div>
            </div>
        </div>

    );
}
