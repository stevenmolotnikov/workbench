import { getWorkspacesWithCollections } from "@/lib/api";
import Link from "next/link";
import { CreateWorkspaceDialog } from "@/components/CreateWorkspaceDialog";
import { ModelsDisplay } from "@/components/ModelsDisplay";

export default async function WorkbenchPage() {
    const workspaces = await getWorkspacesWithCollections();

    return (
        <div className="p-6">
            <ModelsDisplay />
            
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Workspaces</h1>
                <CreateWorkspaceDialog />
            </div>
            
            {workspaces.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No workspaces found</p>
                    <p className="text-sm text-muted-foreground/70">Create a new workspace to get started</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {workspaces.map((workspace) => (
                        <Link
                            key={workspace.id}
                            href={`/workbench/${workspace.id}`}
                            className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-lg">{workspace.name}</h3>
                                    <div className="flex gap-2 mt-1">
                                        {workspace.lensCollections.length > 0 && (
                                            <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                                {workspace.lensCollections.length} Logit Lens
                                            </span>
                                        )}
                                        {workspace.patchingCollections.length > 0 && (
                                            <span className="inline-block px-2 py-1 bg-secondary/10 text-secondary-foreground text-xs rounded-full">
                                                {workspace.patchingCollections.length} Patching
                                            </span>
                                        )}
                                        {workspace.charts.length > 0 && (
                                            <span className="inline-block px-2 py-1 bg-accent/10 text-accent-foreground text-xs rounded-full">
                                                {workspace.charts.length} Charts
                                            </span>
                                        )}
                                    </div>
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
                    ))}
                </div>
            )}
        </div>
    );
}
