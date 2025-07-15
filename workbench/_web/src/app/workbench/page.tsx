"use client";

import { getWorkspacesWithCharts } from "@/lib/api";
import Link from "next/link";
import { CreateWorkspaceDialog } from "@/components/CreateWorkspaceDialog";
import { ModelsDisplay } from "@/components/ModelsDisplay";
import { WorkspaceHeader } from "@/components/WorkspaceHeader";
import { useQuery } from "@tanstack/react-query";

// Force dynamic rendering to avoid build-time database queries
export const dynamic = 'force-dynamic';

export default function WorkbenchPage() {

    const { data: workspaces } = useQuery({
        queryKey: ["workspaces"],
        queryFn: () => getWorkspacesWithCharts()
    });

    return (
        <div className="p-6">
            <ModelsDisplay />
            
            <WorkspaceHeader />
            
            <div className="flex justify-end mb-6">
                <CreateWorkspaceDialog />
            </div>
            
            {!workspaces || workspaces.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No workspaces found</p>
                    <p className="text-sm text-muted-foreground/70">Create a new workspace to get started</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {workspaces.map((workspace) => {
                        return (
                            <Link
                                key={workspace.id}
                                href={`/workbench/${workspace.id}`}
                                className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-lg">{workspace.name}</h3>
                                    </div>
                                    <div className="text-right">
                                        {workspace.public && (
                                            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full mb-1">
                                                Public
                                            </span>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            {workspace.id}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
