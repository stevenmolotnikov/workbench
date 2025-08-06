"use client";

import { useState, useCallback, use } from "react";
import { WorkbenchMenu } from "@/components/WorkbenchMenu";
import InteractiveDisplay from "./components/InteractiveDisplay";

import { ChartDisplay } from "@/components/charts/ChartDisplay";

import { TutorialsSidebar } from "@/components/TutorialsSidebar";
import { useTour } from "@reactour/tour";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

import { cn } from "@/lib/utils";
import { useWorkspace } from "@/stores/useWorkspace";
import { getOrCreateLensConfig } from "@/lib/queries/chartQueries";
import { useQuery } from "@tanstack/react-query";
import useModels from "@/hooks/useModels";

export default function Workbench({ params }: { params: Promise<{ workspaceId: string }> }) {
    const resolvedParams = use(params);

    const { selectedModel } = useWorkspace();
    const {} = useModels();

    const [tutorialsOpen, setTutorialsOpen] = useState(false);
    const { setIsOpen } = useTour();

    const toggleTutorials = useCallback(() => {
        setTutorialsOpen(!tutorialsOpen);
    }, [tutorialsOpen]);

    const closeTutorials = useCallback(() => {
        setIsOpen(false);
        setTutorialsOpen(false);
    }, [setIsOpen]);

    const defaultConfig = {
        prompt: "",
        name: "Default Lens Config",
        model: selectedModel?.name || "",
        token: { idx: 0, id: 0, text: "", targetIds: [] },
    }

    const { data: chartConfig, isSuccess: isChartConfigSuccess } = useQuery({
        queryKey: ["chartConfig", resolvedParams.workspaceId],
        queryFn: () => getOrCreateLensConfig(resolvedParams.workspaceId, defaultConfig),
        enabled: !!selectedModel,
    });

    const [workbenchMode, setWorkbenchMode] = useState<"lens" | "patch">("lens");

    return (
        <div className="flex flex-1 min-h-0">
            {/* Left sidebar */}
            <div
                className={cn(
                    "border-r relative transition-all duration-300 overflow-hidden",
                    tutorialsOpen ? "w-[25vw]" : "w-0"
                )}
            >
                {tutorialsOpen &&
                    <TutorialsSidebar onClose={closeTutorials} />
                }
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                {/* Top bar within main content */}
                <WorkbenchMenu
                    tutorialsOpen={tutorialsOpen}
                    setWorkbenchMode={setWorkbenchMode}
                    workbenchMode={workbenchMode}
                    toggleTutorials={toggleTutorials}
                    workspaceId={resolvedParams.workspaceId}
                />

                <ResizablePanelGroup
                    direction="horizontal"
                    className="flex flex-1 min-h-0 h-full"
                >
                    <ResizablePanel className="h-full" defaultSize={50} minSize={30}>
                        {isChartConfigSuccess &&
                            <InteractiveDisplay initialConfig={chartConfig} />
                        }
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={50} minSize={30}>
                        <ChartDisplay />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
}
