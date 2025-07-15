import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWorkspace } from "@/lib/api";

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