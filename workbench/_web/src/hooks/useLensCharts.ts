import { useWorkspace } from "@/stores/useWorkspace";
import { useParams } from "next/navigation";
import { LensConfigData } from "@/types/lens";
import { useLensGrid, useLensLine } from "@/lib/api/chartApi";
import { useUpdateChartConfig } from "@/lib/api/configApi";

export const useLensCharts = ({config, configId}: {config: LensConfigData, configId: string}) => {
    const { activeTab } = useWorkspace();
    const { workspaceId } = useParams();

    const { mutateAsync: createHeatmap } = useLensGrid();
    const { mutateAsync: updateChartConfig } = useUpdateChartConfig();
    const { mutateAsync: createLineChart } = useLensLine();

    const handleCreateHeatmap = async () => {
        if (!activeTab) return;

        const data = await createHeatmap({
            lensRequest: {
                completion: config,
                chartId: activeTab,
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

    const handleCreateLineChart = async () => {
        if (!activeTab) return;

        const data = await createLineChart({
            lensRequest: {
                completion: config,
                chartId: activeTab,
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
