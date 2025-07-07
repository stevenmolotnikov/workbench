import { getWorkspaces } from "@/lib/api";
import Link from "next/link";
import { CreateWorkspaceDialog } from "@/components/CreateWorkspaceDialog";

export default async function WorkbenchPage() {
    const workspaces = await getWorkspaces();

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Workspaces</h1>
                <CreateWorkspaceDialog />
            </div>
            
            {workspaces.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No workspaces found</p>
                    <p className="text-sm text-gray-400">Create a new workspace to get started</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {workspaces.map((workspace) => (
                        <Link
                            key={workspace.id}
                            href={`/workbench/${workspace.id}`}
                            className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-lg">{workspace.name}</h3>
                                    <p className="text-sm text-gray-600 capitalize">
                                        {workspace.type?.replace('_', ' ')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    {workspace.public && (
                                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full mb-1">
                                            Public
                                        </span>
                                    )}
                                    <p className="text-xs text-gray-500">
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
