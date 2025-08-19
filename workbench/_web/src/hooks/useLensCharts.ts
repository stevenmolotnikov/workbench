import { useParams } from "next/navigation";
import { LensConfigData } from "@/types/lens";
import { useLensGrid, useLensLine } from "@/lib/api/chartApi";
import { useUpdateChartConfig } from "@/lib/api/configApi";
import { useWorkspace } from "@/stores/useWorkspace";

export const useLensCharts = ({ configId }: { configId: string }) => {
    const { workspaceId, chartId } = useParams<{ workspaceId: string, chartId: string }>();
    const { mutateAsync: createHeatmap } = useLensGrid();
    const { mutateAsync: updateChartConfig } = useUpdateChartConfig();
    const { mutateAsync: createLineChart } = useLensLine();

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

    return {
        handleCreateHeatmap,
        handleCreateLineChart,
    };
};
