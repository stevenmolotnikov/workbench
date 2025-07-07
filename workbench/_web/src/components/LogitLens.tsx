"use client";

import { useState, useCallback } from "react";
import { PromptBuilder } from "@/components/prompt-builders/PromptBuilder";
import { LogitLensModes } from "@/types/lens";
import { WorkbenchMenu } from "./WorkbenchMenu";

import { ChartSelector } from "@/components/charts/ChartSelector";

import { ResizableLayout } from "@/components/Layout";
import { WorkspaceHistory } from "./WorkspaceHistory";
import { TutorialsSidebar } from "./TutorialsSidebar";
import { useTour } from "@reactour/tour";

export function LogitLens() {
    const [tutorialsOpen, setTutorialsOpen] = useState(false);
    const { setIsOpen } = useTour();

    const toggleTutorials = useCallback(() => {
        setTutorialsOpen(!tutorialsOpen);
    }, [tutorialsOpen]);

    const closeTutorials = useCallback(() => {
        setIsOpen(false);
        setTutorialsOpen(false);
    }, [setIsOpen]);


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
                    tutorialsOpen={tutorialsOpen}
                    toggleTutorials={toggleTutorials}
                />

                <ResizableLayout
                    workbench={<PromptBuilder />}
                    charts={<ChartSelector modes={LogitLensModes} />}
                />
            </div>
        </div>
    );
}
