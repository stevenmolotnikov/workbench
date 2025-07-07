"use client";

import { useState, useCallback } from "react";
import { PromptBuilder } from "@/components/prompt-builders/PromptBuilder";
import { LogitLensModes } from "@/types/lens";
import { WorkbenchMenu } from "@/components/WorkbenchMenu";

import { ChartSelector } from "@/components/charts/ChartSelector";

import { ResizableLayout } from "@/components/Layout";
import { WorkspaceHistory } from "@/components/WorkspaceHistory";
import { TutorialsSidebar } from "@/components/TutorialsSidebar";
import { useTour } from "@reactour/tour";

import { PatchingHeatmap } from "@/components/charts/types/PatchingHeatmap";
import { PatchingWorkbench } from "@/components/connections/PatchingWorkbench";
import { HeatmapProps } from "@/components/charts/base/Heatmap";

export default function Workbench({ params }: { params: { workspace_id: string } }) {
    const [tutorialsOpen, setTutorialsOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
    const { setIsOpen } = useTour();

    const toggleTutorials = useCallback(() => {
        setTutorialsOpen(!tutorialsOpen);
    }, [tutorialsOpen]);

    const closeTutorials = useCallback(() => {
        setIsOpen(false);
        setTutorialsOpen(false);
    }, [setIsOpen]);

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed(!sidebarCollapsed);
    }, [sidebarCollapsed]);

    const handleSetHeatmapData = useCallback((data: HeatmapProps) => {
        setHeatmapData(data);
    }, []);
    
    const handleSetPatchingLoading = useCallback((loading: boolean) => {
        setPatchingLoading(loading);
    }, []);

    const [heatmapData, setHeatmapData] = useState<HeatmapProps | null>(null);
    const [patchingLoading, setPatchingLoading] = useState(false);

    const [workbenchMode, setWorkbenchMode] = useState<"lens" | "patch">("lens");

    return (
        <div className="flex flex-1 min-h-0">
            {/* Left sidebar */}
            <div
                className={`border-r relative ${tutorialsOpen ? "w-[25vw]" : sidebarCollapsed ? "w-0" : "w-64"
                    } transition-all duration-300 overflow-hidden`}
            >
                {tutorialsOpen ? (
                    <TutorialsSidebar onClose={closeTutorials} />
                ) : sidebarCollapsed ? null : (
                    <WorkspaceHistory />
                )}
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                {/* Top bar within main content */}
                <WorkbenchMenu
                    tutorialsOpen={tutorialsOpen}
                    setWorkbenchMode={setWorkbenchMode}
                    workbenchMode={workbenchMode}
                    toggleTutorials={toggleTutorials}
                    sidebarCollapsed={sidebarCollapsed}
                    toggleSidebar={toggleSidebar}
                />

                {workbenchMode === "lens" ? (
                    <ResizableLayout
                        workbench={<PromptBuilder />}
                        charts={<ChartSelector modes={LogitLensModes} />}
                    />
                ) : (
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
                )}


            </div>
        </div>
    );
}
