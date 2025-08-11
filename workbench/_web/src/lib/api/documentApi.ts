import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDocumentById, getDocumentByWorkspaceId, upsertDocument, createDocument, getDocumentsForWorkspace } from "@/lib/queries/documentQueries";
import { EditorJSData } from "@/types/editor";

export const useGetDocument = (documentId: string) => {
    return useQuery({
        queryKey: ["document", documentId],
        queryFn: () => getDocumentById(documentId),
        enabled: !!documentId,
    });
};

export const useGetDocumentByWorkspace = (workspaceId: string) => {
    return useQuery({
        queryKey: ["document-workspace", workspaceId],
        queryFn: () => getDocumentByWorkspaceId(workspaceId),
        enabled: !!workspaceId,
    });
};

export const useGetDocumentsForWorkspace = (workspaceId: string) => {
    return useQuery({
        queryKey: ["documents", workspaceId],
        queryFn: () => getDocumentsForWorkspace(workspaceId),
        enabled: !!workspaceId,
    });
};

export const useSaveDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ workspaceId, content }: { workspaceId: string; content: EditorJSData }) => {
            return await upsertDocument(workspaceId, content);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["document", variables.workspaceId] });
            console.log("Document saved successfully");
        },
        onError: (error) => {
            console.error("Error saving document:", error);
        },
    });
};

export const useCreateDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (workspaceId: string) => {
            return await createDocument(workspaceId);
        },
        onSuccess: (_, workspaceId) => {
            queryClient.invalidateQueries({ queryKey: ["document", workspaceId] });
            console.log("Document created successfully");
        },
        onError: (error) => {
            console.error("Error creating document:", error);
        },
    });
};