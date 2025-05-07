"use client";

import { LogitLensWorkspace, LogitLensResponse, LensCompletion } from "@/types/lens";
import { ActivationPatchingRequest, ActivationPatchingResponse, ActivationPatchingWorkspace } from "@/types/activation-patching";
import { Annotation } from "@/types/workspace";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace";

interface WorkspaceHistoryProps {
    chartData: LogitLensResponse | ActivationPatchingResponse | null;
    completions?: LensCompletion[];
    patchingRequest?: ActivationPatchingRequest;
    annotations: Annotation[];
    onLoadWorkspace: (workspace: LogitLensWorkspace | ActivationPatchingWorkspace) => void;
}

export function WorkspaceHistory({ chartData, completions, annotations, patchingRequest, onLoadWorkspace }: WorkspaceHistoryProps) {
    const { savedWorkspaces, exportWorkspace, deleteWorkspace } = useWorkspaceStore();

    const handleExportWorkspace = () => {
        if (!chartData) return;

        if ('model_results' in chartData) {  // Check for LogitLensResponse
            const workspace: LogitLensWorkspace = {
                completions: completions ?? [],
                graphData: chartData,
                annotations
            }
            exportWorkspace(workspace);
        } else {  // Must be ActivationPatchingResponse
            const workspace: ActivationPatchingWorkspace = {
                request: patchingRequest,
                graphData: chartData,
                annotations
            }
            exportWorkspace(workspace);
        }
    }

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm">Workspaces</h2>
                    <span className="text-xs">({savedWorkspaces.length}/5)</span>
                </div>
                <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={handleExportWorkspace}
                    disabled={!chartData}
                >
                    <Save size={6} />
                </Button>
            </div>
            <div className="flex-1 overflow-auto">
                <div className="p-4 space-y-2">
                    {savedWorkspaces.map((workspace, index) => (
                        <div
                            key={index}
                            className="p-3 border rounded cursor-pointer"
                            onClick={() => onLoadWorkspace(workspace)}
                        >
                            <div className="flex items-center gap-2 relative">
                                <div className="text-sm font-medium">Workspace {index + 1}</div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute p-1 h-auto -right-1 -top-1"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteWorkspace(index);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="text-xs mt-1">
                                {workspace.annotations.length} annotations
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
