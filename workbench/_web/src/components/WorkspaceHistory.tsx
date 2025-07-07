"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import { useWorkspaceStore } from "@/stores/useWorkspace";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCharts } from "@/stores/useCharts";
import { useAnnotations } from "@/stores/useAnnotations";
import { useLensCollection } from "@/stores/useLensCollection";
import { useModels } from '@/hooks/useModels';
import { cn } from "@/lib/utils";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { 
    createLensCollection, 
    createPatchingCollection, 
    updateLensCollection, 
    updatePatchingCollection,
    getWorkspaceById,
    type Workspace as ApiWorkspace,
    type LensCollection,
    type PatchingCollection,
    type Chart
} from "@/lib/api";
import type { LogitLensWorkspace } from "@/types/lens";

export function WorkspaceHistory() {
    const params = useParams();
    const currentWorkspaceId = params?.workspace_id as string;
    
    const { workspaces, isLoading, deleteWorkspace, createWorkspace, initialize } =
        useWorkspaceStore();
    const { isLoading: isModelsLoading } = useModels();


    const [currentWorkspace, setCurrentWorkspace] = useState<(ApiWorkspace & { lensCollections: LensCollection[], patchingCollections: PatchingCollection[], charts: Chart[] }) | null>(null);

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
        
        // For now, we'll need to load the actual workspace data from collections
        // This is a placeholder until we implement proper workspace loading
        console.log("Loading workspace:", workspaceData);
    };

    const getCurrentWorkspaceData = () => {
        const { activeCompletions } = useLensCollection.getState();
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
            
            // Update lens collection with current state
            if (currentWorkspace.lensCollections.length > 0) {
                await updateLensCollection(currentWorkspace.lensCollections[0].id, workspaceData);
            } else {
                // Create lens collection if it doesn't exist
                await createLensCollection(currentWorkspaceId, workspaceData);
            }
            
            // Update patching collection with empty data for now
            if (currentWorkspace.patchingCollections.length > 0) {
                await updatePatchingCollection(currentWorkspace.patchingCollections[0].id, {});
            } else {
                // Create patching collection if it doesn't exist
                await createPatchingCollection(currentWorkspaceId, {});
            }
            
            console.log("Workspace saved successfully");
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
                    {workspaces.map((workspace, index) => (
                        <div
                            key={workspace.id || index}
                            className={cn(
                                "p-4 border bg-card rounded-lg group",
                                isModelsLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                            )}
                            onClick={() => loadWorkspace(workspace)}
                        >
                            <div className="flex items-center gap-2 relative">
                                <div className="text-sm font-medium">{workspace.name}</div>
                                <ConfirmationPopover
                                    onConfirm={() => deleteWorkspace(workspace.id || "")}
                                />
                            </div>
                            <div className="text-xs mt-1">{getWorkspaceStats(workspace)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

interface ConfirmationPopoverProps {
    onConfirm: () => void;
}

const ConfirmationPopover = ({ onConfirm }: ConfirmationPopoverProps) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 absolute p-1 h-auto -right-1 -top-1"
                >
                    <X className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-auto p-3">
                <div className="space-y-2">
                    <p className="text-sm">Are you sure?</p>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
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
