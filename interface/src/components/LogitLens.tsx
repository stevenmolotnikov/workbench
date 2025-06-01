"use client";

import { useState } from "react";
import { PromptBuilder } from "@/components/prompt-builders/PromptBuilder";
import { LogitLensWorkspace, LogitLensModes } from "@/types/lens";
import { LineGraphData } from "@/types/charts";
import { WorkbenchMenu } from "./WorkbenchMenu";

import { ChartSelector } from "@/components/charts/ChartSelector";

import { ResizableLayout } from "@/components/Layout";
import { WorkspaceHistory } from "./WorkspaceHistory";
import { TutorialsSidebar } from "./TutorialsSidebar";

import { useLensCompletions } from "@/stores/useLensCompletions";
import { useCharts } from "@/stores/useCharts";

// import { useLineGraphAnnotations } from "@/stores/lineGraphAnnotations";

export function LogitLens() {
    const [annotationsOpen, setAnnotationsOpen] = useState(false);
    const [tutorialsOpen, setTutorialsOpen] = useState(false);
    const { activeCompletions, setActiveCompletions } = useLensCompletions();
    // const { annotations, setAnnotations } = useLineGraphAnnotations();
    const { 
        gridPositions, 
        setLayout, 
        setChartData
    } = useCharts();

    const toggleAnnotations = () => {
        setAnnotationsOpen(!annotationsOpen);
    };

    const toggleTutorials = () => {
        setTutorialsOpen(!tutorialsOpen);
    };

    const closeTutorials = () => {
        setTutorialsOpen(false);
    };

    const loadWorkspace = (workspace: LogitLensWorkspace) => {
        setActiveCompletions(workspace.completions);
        // For now, we'll just load the single chart data to the first position if it exists
        // This could be enhanced to save/load multiple chart configurations
        if (workspace.graphData && gridPositions.length > 0) {
            const chartData = {
                type: "lineGraph" as const,
                data: workspace.graphData
            };
            setChartData(0, chartData);
        }
        // setAnnotations(workspace.annotations);
    };

    const exportWorkspace = () => {
        // Export the first chart's data for backward compatibility
        const firstChartData = gridPositions[0]?.chartData;
        const workspace = {
            name: "",
            completions: activeCompletions,
            graphData: firstChartData as LineGraphData | null,
            annotations: [],
        };
        return workspace;
    };

    return (
        <div className="flex flex-1 min-h-0">
            {/* Left sidebar */}
            <div className={`border-r ${tutorialsOpen ? 'w-[25vw]' : 'w-64'} transition-all duration-300`}>
                {tutorialsOpen ? (
                    <TutorialsSidebar onClose={closeTutorials} />
                ) : (
                    <WorkspaceHistory
                        loadWorkspace={(workspace) => loadWorkspace(workspace as LogitLensWorkspace)}
                        exportWorkspace={exportWorkspace}
                    />
                )}
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                {/* Top bar within main content */}
                <WorkbenchMenu
                    toggleAnnotations={toggleAnnotations}
                    toggleTutorials={toggleTutorials}
                    setLayout={setLayout}
                />

                <ResizableLayout
                    annotationsOpen={annotationsOpen}
                    workbench={<PromptBuilder />}
                    charts={
                        <ChartSelector
                            modes={LogitLensModes}
                        />
                    }
                />
            </div>
        </div>
    );
}
