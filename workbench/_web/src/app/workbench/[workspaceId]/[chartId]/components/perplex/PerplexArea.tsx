import { PerplexCard } from "./PerplexCard";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getConfigForChart } from "@/lib/queries/chartQueries";
import { PerplexConfig } from "@/db/schema";
import { queryKeys } from "@/lib/queryKeys";
import { useMemo } from "react";
import { getModels } from "@/lib/api/modelsApi";
import { useWorkspace } from "@/stores/useWorkspace";

export default function PerplexArea() {
    const { chartId } = useParams<{ chartId: string }>();

    const { data: config } = useQuery({
        queryKey: queryKeys.charts.config(chartId),
        queryFn: () => getConfigForChart(chartId),
        enabled: !!chartId,
    });

    const { selectedModelIdx } = useWorkspace();
    const { data: models } = useQuery({
        queryKey: ['models'],
        queryFn: getModels,
        refetchInterval: 120000,
    });

    const selectedModel = useMemo(() => models?.[selectedModelIdx].name, [models, selectedModelIdx]);

    if (!config || !selectedModel) {
        return (
            <div className="h-full flex flex-col">
                <div className="p-3 border-b">
                    <h2 className="text-sm pl-2 font-medium">Perplex</h2>
                </div>

                <div className="h-48 animate-pulse bg-muted/50 m-3 rounded" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="p-3 border-b">
                <h2 className="text-sm pl-2 font-medium">Perplex</h2>
            </div>

            <div className="p-3 overflow-auto">
                <PerplexCard initialConfig={config as PerplexConfig} selectedModel={selectedModel} />
            </div>
        </div>
    );
}










