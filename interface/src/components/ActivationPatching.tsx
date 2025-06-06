"use client";

import { useState, useCallback } from "react";
import { PatchingWorkbench } from "@/components/connections/PatchingWorkbench";
import { WorkbenchMenu } from "./WorkbenchMenu";
import { ChartSelector } from "@/components/charts/ChartSelector";
import { ResizableLayout } from "@/components/Layout";
import { WorkspaceHistory } from "./WorkspaceHistory";
import { TutorialsSidebar } from "./TutorialsSidebar";
import { ActivationPatchingModes } from "@/types/patching";

export function ActivationPatching() {
    const [tutorialsOpen, setTutorialsOpen] = useState(false);

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
                <WorkbenchMenu tutorialsOpen={tutorialsOpen} toggleTutorials={toggleTutorials} />

                <ResizableLayout
                    workbench={<PatchingWorkbench />}
                    charts={<ChartSelector modes={ActivationPatchingModes} />}
                />
            </div>
        </div>
    );
}
