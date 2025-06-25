"use client";

import { useState, useCallback } from "react";
import { PatchingWorkbench } from "@/components/connections/PatchingWorkbench";
import { WorkbenchMenu } from "./WorkbenchMenu";
import { ResizableLayout } from "@/components/Layout";
import { WorkspaceHistory } from "./WorkspaceHistory";
import { TutorialsSidebar } from "./TutorialsSidebar";
import { PatchingHeatmap } from "./charts/types/PatchingHeatmap";
import { HeatmapProps } from "./charts/base/Heatmap";

export function ActivationPatching() {
    const [tutorialsOpen, setTutorialsOpen] = useState(false);

    const [heatmapData, setHeatmapData] = useState<HeatmapProps | null>(null);
    const [patchingLoading, setPatchingLoading] = useState<boolean>(false);

    const toggleTutorials = useCallback(() => {
        setTutorialsOpen(!tutorialsOpen);
    }, [tutorialsOpen]);

    const closeTutorials = useCallback(() => {
        setTutorialsOpen(false);
    }, []);

    const handleSetHeatmapData = useCallback((data: HeatmapProps) => {
        setHeatmapData(data);
    }, []);

    const handleSetPatchingLoading = useCallback((loading: boolean) => {
        setPatchingLoading(loading);
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
                    workbench={<PatchingWorkbench setHeatmapData={handleSetHeatmapData} setPatchingLoading={handleSetPatchingLoading} />}
                    charts={
                        <div className="h-full w-full bg-card p-4">
                            <div className="relative h-full w-full">
                                <PatchingHeatmap isLoading={patchingLoading} data={heatmapData} />
                            </div>
                        </div>
                    }
                />
            </div>
        </div>
    );
}
