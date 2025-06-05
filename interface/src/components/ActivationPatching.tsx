"use client";

import { useState, useCallback } from "react";
import { PatchingWorkbench } from "@/components/connections/PatchingWorkbench";
import { WorkbenchMenu } from "./WorkbenchMenu";
import { ChartSelector } from "@/components/charts/ChartSelector";
import { ResizableLayout } from "@/components/Layout";
import { WorkspaceHistory } from "./WorkspaceHistory";
import { TutorialsSidebar } from "./TutorialsSidebar";
import { ActivationPatchingModes, PatchingCompletion } from "@/types/patching";
import { useConnection } from "@/hooks/useConnection";


export function ActivationPatching() {
    const [annotationsOpen, setAnnotationsOpen] = useState(false);
    const [tutorialsOpen, setTutorialsOpen] = useState(false);
    const connectionsHook = useConnection();

    const makeDefaultCompletion = (name: string): PatchingCompletion => ({
        id: name,
        prompt: "",
        tokens: [],
    });

    const [source, setSource] = useState<PatchingCompletion>(makeDefaultCompletion("source"));
    const [destination, setDestination] = useState<PatchingCompletion>(makeDefaultCompletion("destination"));

    const toggleAnnotations = useCallback(() => {
        setAnnotationsOpen(!annotationsOpen);
    }, [annotationsOpen]);

    const toggleTutorials = useCallback(() => {
        setTutorialsOpen(!tutorialsOpen);
    }, [tutorialsOpen]);

    const closeTutorials = useCallback(() => {
        setTutorialsOpen(false);
    }, []);

    return (
        <div className="flex flex-1 min-h-0">
            {/* Left sidebar */}
            <div
                className={`border-r ${
                    tutorialsOpen ? "w-[25vw]" : "w-64"
                } transition-all duration-300`}
            >
                {tutorialsOpen ? (
                    <TutorialsSidebar onClose={closeTutorials} />
                ) : (
                    <WorkspaceHistory />
                )}
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                {/* Top bar within main content */}
                <WorkbenchMenu
                    toggleAnnotations={toggleAnnotations}
                    toggleTutorials={toggleTutorials}
                />

                <ResizableLayout
                    annotationsOpen={annotationsOpen}
                    workbench={
                        <PatchingWorkbench
                            connectionsHook={connectionsHook}
                            source={source}
                            destination={destination}
                            setSource={setSource}
                            setDestination={setDestination}
                        />
                    }
                    charts={<ChartSelector modes={ActivationPatchingModes} />}
                />
            </div>
        </div>
    );
}
