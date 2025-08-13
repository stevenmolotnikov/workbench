import { ModelSelector } from "@/components/ModelSelector";
import { useWorkspace } from "@/stores/useWorkspace";
import { CompletionCard } from "./CompletionCard";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getConfigForChart } from "@/lib/queries/chartQueries";
import { LensConfig } from "@/db/schema";

export default function LensArea() {
    const { selectedModel } = useWorkspace();
    const { workspaceId, chartId } = useParams<{ workspaceId: string; chartId: string }>();

    const { data: config } = useQuery({
        queryKey: ["chartConfig", workspaceId, chartId],
        queryFn: () => getConfigForChart(chartId),
        enabled: !!selectedModel && !!chartId,
    });

    if (!config) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                Loading config…
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="px-2 py-2 border-b h-12 flex items-center justify-between">
                <h2 className="text-sm pl-2 font-medium">Model</h2>
                <ModelSelector />
            </div>

            <div className="p-2">
                {/* Assume lens config here; unified page will gate by config.type */}
                <CompletionCard initialConfig={config as LensConfig} />
            </div>
        </div>
    );
}