"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import { useWorkspaceStore } from "@/stores/useWorkspace";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCharts } from "@/stores/useCharts";
import { useAnnotations } from "@/stores/useAnnotations";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { useModels } from '@/hooks/useModels';
import { cn } from "@/lib/utils";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { 
    createChart, 
    updateChart,
    getWorkspaceById,
    type Workspace as ApiWorkspace,
    type Chart
} from "@/lib/api";

type WorkspaceWithCharts = ApiWorkspace & { 
    charts: Chart[] 
};

export function WorkspaceHistory() {
    const params = useParams();
    const router = useRouter();
    const currentWorkspaceId = params?.workspace_id as string;
    
    const { workspaces, isLoading, deleteWorkspace, createWorkspace, initialize } =
        useWorkspaceStore();
    const { isLoading: isModelsLoading } = useModels();

    const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceWithCharts | null>(null);

    const { annotations, setAnnotations, groups, setGroups } = useAnnotations();
    const { setGridPositions, gridPositions } = useCharts();

    // Initialize workspace store when component mounts
    useEffect(() => {
        initialize();
    }, [initialize]);

    // Load current workspace data when workspace ID changes
    useEffect(() => {
        if (currentWorkspaceId) {
            loadCurrentWorkspace();
        }
    }, [currentWorkspaceId]);

    const loadCurrentWorkspace = async () => {
        if (!currentWorkspaceId) return;
        try {
            const workspace = await getWorkspaceById(currentWorkspaceId);
            setCurrentWorkspace(workspace);
        } catch (error) {
            console.error("Failed to load current workspace:", error);
        }
    };

    const loadWorkspace = (workspaceData: ApiWorkspace) => {
        if (isModelsLoading) return;
        
        // For now, we'll need to load the actual workspace data from charts
        // This is a placeholder until we implement proper workspace loading
        console.log("Loading workspace:", workspaceData);
    };

    const handleOpenWorkspace = (workspaceId: string) => {
        if (workspaceId === currentWorkspaceId) return; // Don't navigate to current workspace
        router.push(`/workbench/${workspaceId}`);
    };

    const getCurrentWorkspaceData = () => {
        const { activeCompletions } = useLensWorkspace.getState();
        return {
            completions: activeCompletions,
            graphData: gridPositions,
            annotations: annotations,
            groups: groups,
        };
    };

    const handleSaveWorkspace = async () => {
        if (!currentWorkspaceId || !currentWorkspace) {
            console.error("No current workspace to save to");
            return;
        }
        
        try {
            // Get current workspace data
            const workspaceData = getCurrentWorkspaceData();
            
            // Find or create lens chart
            const lensChart = currentWorkspace.charts.find(c => c.workspaceType === "lens");
            if (lensChart) {
                await updateChart(lensChart.id, workspaceData);
            } else {
                // Create lens chart if it doesn't exist
                await createChart(currentWorkspaceId, "line", "lens", workspaceData);
            }
            
            // Find or create patching chart
            const patchingChart = currentWorkspace.charts.find(c => c.workspaceType === "patching");
            if (patchingChart) {
                await updateChart(patchingChart.id, {});
            } else {
                // Create patching chart if it doesn't exist
                await createChart(currentWorkspaceId, "heatmap", "patching", {});
            }
            
            console.log("Workspace saved successfully");
            // Reload current workspace to get updated data
            await loadCurrentWorkspace();
        } catch (error) {
            console.error("Failed to save workspace:", error);
        }
    };

    const getWorkspaceStats = (workspace: ApiWorkspace) => {
        // Since we're working with basic workspace records now,
        // we'll need to fetch the actual data to show stats
        // For now, show basic info
        return "Workspace data";
    };

    // Sort workspaces to put current workspace first
    const sortedWorkspaces = [...workspaces].sort((a, b) => {
        if (a.id === currentWorkspaceId) return -1;
        if (b.id === currentWorkspaceId) return 1;
        return 0;
    });

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm">Workspaces</h2>
                    <span className="text-xs">({workspaces.length}/5)</span>
                </div>
                <TooltipButton
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={handleSaveWorkspace}
                    disabled={isLoading || !currentWorkspaceId}
                    tooltip="Save current workspace"
                >
                    <Save size={6} />
                </TooltipButton>
            </div>
            <div className="flex-1 overflow-auto">
                <div className="p-4 space-y-2">
                    {sortedWorkspaces.map((workspace, index) => {
                        const isCurrentWorkspace = workspace.id === currentWorkspaceId;
                        
                        return (
                            <div
                                key={workspace.id || index}
                                className={cn(
                                    "p-4 border bg-card rounded-lg group relative",
                                    isCurrentWorkspace ? "border-primary" : "",
                                    isModelsLoading ? "opacity-50 cursor-not-allowed" : 
                                    isCurrentWorkspace ? "cursor-default" : "cursor-pointer hover:bg-accent"
                                )}
                                onClick={() => !isCurrentWorkspace && handleOpenWorkspace(workspace.id || "")}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium">
                                        {workspace.name}
                                        {isCurrentWorkspace && (
                                            <span className="text-xs text-muted-foreground ml-2">
                                                (current)
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 ml-auto">
                                        <ConfirmationPopover
                                            onConfirm={() => deleteWorkspace(workspace.id || "")}
                                            isCurrentWorkspace={isCurrentWorkspace}
                                        />
                                    </div>
                                </div>
                                <div className="text-xs mt-1">{getWorkspaceStats(workspace)}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

interface ConfirmationPopoverProps {
    onConfirm: () => void;
    isCurrentWorkspace?: boolean;
}

const ConfirmationPopover = ({ onConfirm, isCurrentWorkspace = false }: ConfirmationPopoverProps) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 p-1 h-auto"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                    <X className="h-3 w-3" />
                </Button>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-auto p-3">
                <div className="space-y-2">
                    <p className="text-sm">
                        {isCurrentWorkspace 
                            ? "Delete current workspace? You'll be redirected to the workspace list."
                            : "Are you sure you want to delete this workspace?"
                        }
                    </p>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            onConfirm();
                        }}
                    >
                        Delete
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
