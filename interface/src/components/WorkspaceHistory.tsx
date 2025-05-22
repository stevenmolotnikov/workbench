"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

import { Save, X } from "lucide-react";
import { useWorkspaceStore, type Workspace } from "@/stores/useWorkspace";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface WorkspaceHistoryProps {
    loadWorkspace: (workspace: Workspace) => void;
    exportWorkspace: () => Workspace;
}

export function WorkspaceHistory({ loadWorkspace, exportWorkspace }: WorkspaceHistoryProps) {
    const { workspaces, session, isLoading, deleteWorkspace, createWorkspace } =
        useWorkspaceStore();

    const [pendingWorkspace, setPendingWorkspace] = useState<Workspace | null>(null);

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
                        <div className="text-sm font-medium">
                            Pending Workspace
                            <Input
                                type="text"
                                value={pendingWorkspace.name}
                                onChange={onPendingWorkspaceNameChange}
                            />
                            <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={handleCreateWorkspace}
                            >
                                <Save size={6} />
                            </Button>
                        </div>
                    )}
                    {workspaces.map((workspace, index) => (
                        <div
                            key={index}
                            className="p-3 border rounded cursor-pointer"
                            onClick={() => loadWorkspace(workspace)}
                        >
                            <div className="flex items-center gap-2 relative">
                                <div className="text-sm font-medium">{workspace.name}</div>
                                <ConfirmationPopover
                                    onConfirm={() => deleteWorkspace(workspace.id)}
                                />
                            </div>
                            <div className="text-xs mt-1">
                                {workspace.annotations?.length || 0} annotations
                            </div>
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
                <Button variant="ghost" size="sm" className="absolute p-1 h-auto -right-1 -top-1">
                    <X className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent>
                Are you sure you want to delete this workspace?
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onConfirm();
                    }}
                >
                    Delete
                </Button>
            </PopoverContent>
        </Popover>
    );
};
