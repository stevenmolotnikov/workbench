import { useParams } from "next/navigation";
import { LensConfigData } from "@/types/lens";
import { useLensGrid, useLensLine } from "@/lib/api/chartApi";
import { useUpdateChartConfig } from "@/lib/api/configApi";

export const useLensCharts = ({ configId }: { configId: string }) => {
    const { workspaceId, chartId } = useParams<{ workspaceId: string, chartId: string }>();
    const { mutateAsync: createHeatmap, isPending: isCreatingHeatmap } = useLensGrid();
    const { mutateAsync: updateChartConfig, isPending: isUpdatingChartConfig } = useUpdateChartConfig();
    const { mutateAsync: createLineChart, isPending: isCreatingLineChart } = useLensLine();

    const handleCreateHeatmap = async (config: LensConfigData) => {
        const data = await createHeatmap({
            lensRequest: {
                completion: config,
                chartId: chartId,
            },
            configId: configId,
        });

        await updateChartConfig({
            configId: configId,
            config: {
                data: config,
                workspaceId: workspaceId as string,
                type: "lens",
            },
        });

        return data;
    };

    const handleCreateLineChart = async (config: LensConfigData) => {
        const data = await createLineChart({
            lensRequest: {
                completion: config,
                chartId: chartId,
            },
            configId: configId,
        });

        await updateChartConfig({
            configId: configId,
            config: {
                data: config,
                workspaceId: workspaceId as string,
                type: "lens",
            },
        });

        return data;
    };

    const isExecuting = isCreatingHeatmap || isCreatingLineChart || isUpdatingChartConfig;

    return {
        isExecuting,
        handleCreateHeatmap,
        handleCreateLineChart,
    };
};
