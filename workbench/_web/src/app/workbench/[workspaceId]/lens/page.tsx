"use client";

import { useState, useCallback, useEffect, use } from "react";
import { WorkbenchMenu } from "@/components/WorkbenchMenu";
import InteractiveDisplay from "@/components/lens/InteractiveDisplay";
import { PromptBuilder } from "@/components/lens/PromptBuilder";

import { ChartDisplay } from "@/components/charts/ChartDisplay";

import { TutorialsSidebar } from "@/components/TutorialsSidebar";
import { useTour } from "@reactour/tour";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

import { getWorkspaceById } from "@/lib/queries/workspaceQueries";
import { getCurrentUser } from "@/lib/session";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";


export default function Workbench({ params }: { params: Promise<{ workspaceId: string }> }) {
    const resolvedParams = use(params);
    const [tutorialsOpen, setTutorialsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const { setIsOpen } = useTour();
    const router = useRouter();

    useEffect(() => {
        async function checkAccess() {
            try {
                // Try to get the workspace
                const workspace = await getWorkspaceById(resolvedParams.workspaceId);
                setHasAccess(true);
            } catch (error) {
                console.error("Access check failed:", error);
                // Check if user is logged in
                const user = await getCurrentUser();
                if (!user) {
                    // Redirect to login with this workspace as the redirect target
                    router.push(`/login?redirect=/workbench/${resolvedParams.workspaceId}`);
                } else {
                    // User is logged in but doesn't have access
                    setHasAccess(false);
                }
            } finally {
                setIsLoading(false);
            }
        }

        checkAccess();
    }, [resolvedParams.workspaceId, router]);

    const toggleTutorials = useCallback(() => {
        setTutorialsOpen(!tutorialsOpen);
    }, [tutorialsOpen]);

    const closeTutorials = useCallback(() => {
        setIsOpen(false);
        setTutorialsOpen(false);
    }, [setIsOpen]);

    const [workbenchMode, setWorkbenchMode] = useState<"lens" | "patch">("lens");

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground">Loading workspace...</p>
                </div>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
                    <p className="text-muted-foreground">You don't have permission to access this workspace.</p>
                </div>
            </div>
        );
    }

    const clickHandler = (tokenIndex: number, layerIndex: number) => {
        console.log(`Clicked token ${tokenIndex} at layer ${layerIndex}`);
    }


    const tokenLabels = ["The", "quick", "brown", "fox", "jumps"];
    const unembedLabels = ["cat", "dog", "bird", "fish", "lion"];

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
                        <ScrollArea className="h-full">
                            {/* <InteractiveDisplay /> */}
                            <PromptBuilder />
                        </ScrollArea>
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
