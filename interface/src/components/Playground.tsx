"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { LogitLens } from "@/components/LogitLens";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ActivationPatching } from "./ActivationPatching";


type ModelLoadStatus = 'loading' | 'success' | 'error';
type WorkbenchMode = "logit-lens" | "activation-patching";

export function Playground() {
    const [modelLoadStatus, setModelLoadStatus] = useState<ModelLoadStatus>('loading');
    const [workbenchMode, setWorkbenchMode] = useState<WorkbenchMode>("logit-lens");

    const getStatusMessage = () => {
        if (modelLoadStatus === 'loading') {
            return (
                <div>
                    The backend is hosted as a deployment on <a href="https://modal.com" className="text-blue-500">Modal</a>.
                    We're starting up a container for your session.
                </div>
            );
        } else if (modelLoadStatus === 'success') {
            return (
                <div>
                    Some things might be slow, but they'll warm up soon enough!
                </div>
            );
        } else if (modelLoadStatus === 'error') {
            return (
                <div>
                    Could not connect to the backend. Reach out to Caden, he probably turned it off.
                </div>
            );
        }
    }

    return (
        <div className="flex flex-col h-screen">
            <header className="border-b  px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img
                        src="/images/NSF.png"
                        alt="NSF Logo"
                        className="h-8"
                    />
                    <img
                        src="/images/NDIF.png"
                        alt="NDIF Logo"
                        className="h-8"
                    />
                </div>

                <nav className="flex gap-2 items-center">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="secondary"
                                className={cn({
                                    "animate-pulse": modelLoadStatus === 'loading'
                                })}
                                size="sm"
                            >
                                {/* {modelLoadStatus === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} */}
                                <div
                                    className={cn("text-white", {
                                        "text-yellow-500 hover:text-yellow-600 animate-pulse": modelLoadStatus === 'loading',
                                        "text-green-600 hover:text-green-700": modelLoadStatus === 'success',
                                        "text-destructive hover:text-destructive": modelLoadStatus === 'error',
                                    })}
                                >
                                    ●
                                </div>
                                {modelLoadStatus === 'loading' ? 'Connecting' : modelLoadStatus === 'success' ? 'Ready' : 'Error'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            {getStatusMessage()}
                        </PopoverContent>
                    </Popover>

                    <Button variant="ghost" onClick={() => window.open("https://nnsight.net", "_blank")} size="sm">NNsight</Button>
                    <ModeToggle />
                </nav>
            </header>
            {workbenchMode === "logit-lens" && (
                <LogitLens modelLoadStatus={modelLoadStatus} setModelLoadStatus={setModelLoadStatus} workbenchMode={workbenchMode} setWorkbenchMode={setWorkbenchMode} />
            )}
            {workbenchMode === "activation-patching" && (
                <ActivationPatching modelLoadStatus={modelLoadStatus} setModelLoadStatus={setModelLoadStatus} workbenchMode={workbenchMode} setWorkbenchMode={setWorkbenchMode} />
            )}
        </div>
    );
}
