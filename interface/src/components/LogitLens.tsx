"use client";

import { useState } from "react";
import { PromptBuilder } from "@/components/prompt-builders/PromptBuilder";
import { LineGraphData, LogitLensWorkspace, LogitLensModes } from "@/types/lens";
import { WorkbenchMenu } from "./WorkbenchMenu";

import { ChartSelector } from "@/components/charts/ChartSelector";

import { ResizableLayout } from "@/components/Layout";
import { WorkspaceHistory } from "./WorkspaceHistory";

import { useLensCompletions } from "@/stores/useLensCompletions";
import { useLensWorkbench } from "@/stores/useLensWorkbench";

import { fetchLogitLensData, fetchGridLensData } from "@/api/lens";
import { useLineGraphAnnotations } from "@/stores/lineGraphAnnotations";

export function LogitLens() {
    const [annotationsOpen, setAnnotationsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const { activeCompletions, setActiveCompletions } = useLensCompletions();
    const { annotations, setAnnotations } = useLineGraphAnnotations();
    const { 
        layout, 
        gridPositions, 
        setLayout, 
        setChartData, 
        setLoading, 
        clearAllData,
        getPopulatedPositions 
    } = useLensWorkbench();

    const toggleAnnotations = () => {
        setAnnotationsOpen(!annotationsOpen);
    };

    const loadWorkspace = (workspace: LogitLensWorkspace) => {
        setActiveCompletions(workspace.completions);
        // For now, we'll just load the single chart data to the first position if it exists
        // This could be enhanced to save/load multiple chart configurations
        if (workspace.graphData && gridPositions.length > 0) {
            setChartData(0, workspace.graphData);
        }
        setAnnotations(workspace.annotations);
    };

    const exportWorkspace = () => {
        // Export the first chart's data for backward compatibility
        const firstChartData = gridPositions[0]?.chartData;
        const workspace = {
            name: "",
            completions: activeCompletions,
            graphData: firstChartData as LineGraphData | null,
            annotations: annotations,
        };
        return workspace;
    };

    const handleRun = async () => {
        setIsLoading(true);
        clearAllData(); // Clear all existing chart data

        const populatedPositions = getPopulatedPositions();
        
        try {
            // Send requests for each populated chart type
            const promises = populatedPositions.map(async ({ position, chartType }) => {
                setLoading(position, true);
                
                try {
                    const mode = LogitLensModes[chartType];
                    
                    if (mode.chartType === "heatmap") {
                        // For heatmap (grid lens), we need to send each completion separately
                        // For now, just use the first completion
                        if (activeCompletions.length > 0) {
                            const firstCompletion = activeCompletions[0];
                            const data = await fetchGridLensData(firstCompletion);
                            setChartData(position, data);
                        } else {
                            setChartData(position, null);
                        }
                    } else {
                        // For line charts (targeted lens), send all completions
                        const data = await fetchLogitLensData(activeCompletions);
                        setChartData(position, data as LineGraphData);
                    }
                } catch (error) {
                    console.error(`Error fetching data for chart at position ${position}:`, error);
                    setChartData(position, null);
                } finally {
                    setLoading(position, false);
                }
            });

            await Promise.all(promises);
        } catch (error) {
            console.error("Error in handleRun:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-1 min-h-0">
            {/* Left sidebar */}
            <div className="w-64 border-r">
                <WorkspaceHistory
                    loadWorkspace={(workspace) => loadWorkspace(workspace as LogitLensWorkspace)}
                    exportWorkspace={exportWorkspace}
                />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                {/* Top bar within main content */}
                <WorkbenchMenu
                    toggleAnnotations={toggleAnnotations}
                    setLayout={setLayout}
                    handleRun={handleRun}
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
