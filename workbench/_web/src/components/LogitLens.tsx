"use client";

import { useState, useCallback } from "react";
import { PromptBuilder } from "@/components/prompt-builders/PromptBuilder";
import { LogitLensModes } from "@/types/lens";
import { WorkbenchMenu } from "./WorkbenchMenu";
import { useDb } from "@/stores/useDb";

import { ChartSelector } from "@/components/charts/ChartSelector";

import { ResizableLayout } from "@/components/Layout";
import { WorkspaceHistory } from "./WorkspaceHistory";
import { TutorialsSidebar } from "./TutorialsSidebar";
import { useTour } from "@reactour/tour";

export function LogitLens() {
    const [tutorialsOpen, setTutorialsOpen] = useState(false);
    const { setIsOpen } = useTour();
    const { getWorkspaces, createWorkspace, workspaces, loading, error } = useDb();

    const toggleTutorials = useCallback(() => {
        setTutorialsOpen(!tutorialsOpen);
    }, [tutorialsOpen]);

    const closeTutorials = useCallback(() => {
        setIsOpen(false);
        setTutorialsOpen(false);
    }, [setIsOpen]);

    const handleTestDb = useCallback(async () => {
        console.log("Testing database connection...");
        await getWorkspaces();
    }, [getWorkspaces]);

    const handleCreateTestWorkspace = useCallback(async () => {
        const name = `Test Workspace ${Date.now()}`;
        console.log("Creating test workspace:", name);
        await createWorkspace(name, false);
    }, [createWorkspace]);

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

                {/* DB Test Section */}
                <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={handleTestDb}
                            disabled={loading}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                            {loading ? "Loading..." : "Test DB Connection"}
                        </button>
                        <button
                            onClick={handleCreateTestWorkspace}
                            disabled={loading}
                            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                        >
                            Create Test Workspace
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Workspaces: {workspaces.length}
                        </span>
                        {error && (
                            <span className="text-sm text-red-500">
                                Error: {error}
                            </span>
                        )}
                    </div>
                </div>

                <ResizableLayout
                    workbench={<PromptBuilder />}
                    charts={<ChartSelector modes={LogitLensModes} />}
                />
            </div>
        </div>
    );
}
