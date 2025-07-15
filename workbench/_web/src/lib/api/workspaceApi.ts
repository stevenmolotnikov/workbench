import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWorkspace } from "@/lib/api";
import { setWorkspaceData } from "@/lib/queries/chartQueries";
import { WorkspaceData } from "@/types/workspace";

/*************
 * Mutations *
 *************/

interface CreateWorkspaceParams {
    name: string;
    public?: boolean;
}

export const useCreateWorkspace = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ name, public: isPublic = false }: CreateWorkspaceParams) => {
            // This calls the server action which handles authentication
            const workspace = await createWorkspace(name, isPublic);
            return workspace;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            console.log("Successfully created workspace:", data.id);
        },
        onError: (error) => {
            console.error("Error creating workspace:", error);
        },
    });
};

export const useUpdateChartWorkspaceData = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ chartId, data }: { chartId: string; data: WorkspaceData[keyof WorkspaceData] }) => {
            await setWorkspaceData(chartId, data);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            console.log("Successfully updated workspace");
        },
        onError: (error) => {
            console.error("Error updating workspace:", error);
        },
    });
};