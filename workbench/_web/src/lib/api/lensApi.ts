// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { addChartConfig, deleteChartConfig } from "@/lib/queries/chartQueries";
// import { NewChartConfig } from "@/db/schema";

// export const useCreateChartConfig = () => {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: async ({
//             chartConfig,
//         }: {
//             chartConfig: NewChartConfig;
//         }) => {
//             await addChartConfig(chartConfig);
//         },
//         onError: (error, variables, context) => {
//             console.error("Error generating completion:", error);
//         },
//     });
// };

// export const useDeleteChartConfig = () => {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: async ({
//             configId
//         }: {
//             configId: string;
//         }) => {
//             await deleteChartConfig(configId);
//         },
//         onError: (error, variables, context) => {
//             console.error("Error deleting completion:", error);
//         },
//     });
// };
