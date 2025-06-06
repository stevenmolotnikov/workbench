"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import { useWorkspaceStore, type Workspace } from "@/stores/useWorkspace";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCharts } from "@/stores/useCharts";
import { useAnnotations } from "@/stores/useAnnotations";
import { useLensCompletions } from "@/stores/useLensCompletions";
import { useModels } from '@/hooks/useModels';
import { cn } from "@/lib/utils";

export function WorkspaceHistory() {
    const { workspaces, session, isLoading, deleteWorkspace, createWorkspace } =
        useWorkspaceStore();
    const { isLoading: isModelsLoading } = useModels();

    const [pendingWorkspace, setPendingWorkspace] = useState<Workspace | null>(null);

    const { annotations, setAnnotations } = useAnnotations();
    const { setGridPositions, gridPositions } = useCharts();

    const loadWorkspace = (workspace: Workspace) => {
        if (isModelsLoading) return;
        
        if ("completions" in workspace) {
            const { setActiveCompletions } = useLensCompletions.getState();
            setActiveCompletions(workspace.completions);
            setGridPositions(workspace.graphData);
            setAnnotations(workspace.annotations);
        }
    };

    const exportWorkspace = () => {
        const { activeCompletions } = useLensCompletions.getState();
        const workspace = {
            name: "",
            completions: activeCompletions,
            graphData: gridPositions,
            annotations: annotations,
        };
        return workspace;
    };

    const addPendingWorkspace = (workspace: Workspace) => {
        if (workspaces.length >= 5) {
            return;
        }

        setPendingWorkspace(workspace);
    };

    const onPendingWorkspaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!pendingWorkspace) return;
        setPendingWorkspace({ ...pendingWorkspace, name: e.target.value });
    };

    const handleCreateWorkspace = () => {
        if (!pendingWorkspace) return;
        createWorkspace(pendingWorkspace);
        setPendingWorkspace(null);
    };

    const getWorkspaceStats = (workspace: Workspace) => {
        let charts = 0;
        let completions = 0;
        const annotations = workspace.annotations?.length || 0;

        if ("completions" in workspace) {
            // LogitLensWorkspace
            charts = workspace.graphData?.length || 0;
            completions = workspace.completions?.length || 0;
        } else {
            // ActivationPatchingWorkspace
            charts = workspace.graphData ? 1 : 0;
            completions = 2; // source and destination
        }

        return `${charts} charts • ${completions} completions • ${annotations} annotations`;
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm">Workspaces</h2>
                    <span className="text-xs">({workspaces.length}/5)</span>
                </div>
                <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => addPendingWorkspace(exportWorkspace())}
                    disabled={isLoading || !session}
                >
                    <Save size={6} />
                </Button>
            </div>
            <div className="flex-1 overflow-auto">
                <div className="p-4 space-y-2">
                    {pendingWorkspace && (
                        <div className="p-4 border bg-card rounded-lg space-y-3">
                            <div className="text-xs text-muted-foreground">
                                Create a new workspace
                            </div>
                            <Input
                                type="text"
                                value={pendingWorkspace.name}
                                placeholder="Enter workspace name..."
                                onChange={onPendingWorkspaceNameChange}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setPendingWorkspace(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={handleCreateWorkspace}
                                    disabled={!pendingWorkspace.name.trim()}
                                >
                                    Create
                                </Button>
                            </div>
                        </div>
                    )}
                    {workspaces.map((workspace, index) => (
                        <div
                            key={index}
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
