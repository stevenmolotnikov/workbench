"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOrCreateLensCharts } from "@/lib/queries/chartQueries";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid3X3, Layers, Plus } from "lucide-react";
import { useWorkspace } from "@/stores/useWorkspace";
import { useCreateLensChartPair } from "@/lib/api/chartApi";

export default function ChartCardsSidebar() {
    const { workspaceId } = useParams();
    const { activeTab, setActiveTab, selectedModel } = useWorkspace();

    const { data: { lensCharts, unlinkedCharts } = { lensCharts: [], unlinkedCharts: [] }, isLoading } = useQuery({
        queryKey: ["lensCharts", workspaceId],
        queryFn: () => getOrCreateLensCharts(workspaceId as string, {
            workspaceId: workspaceId as string,
        }),
    });

    const allCharts = useMemo(() => {
        return [...(lensCharts || []), ...(unlinkedCharts || [])];
    }, [lensCharts, unlinkedCharts]);

    const { mutate: createPair, isPending: isCreating } = useCreateLensChartPair();

    const handleCreate = () => {
        createPair({
            workspaceId: workspaceId as string,
            defaultConfig: {
                prompt: "",
                model: selectedModel?.name || "",
                token: { idx: 0, id: 0, text: "", targetIds: [] },
            },
        });
    };

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="h-12 px-3 py-2 border-b flex items-center justify-between">
                <span className="text-sm font-medium">Charts</span>
                <Button size="sm" variant="ghost" onClick={handleCreate} disabled={isCreating}>
                    <Plus className="h-4 w-4 mr-1" /> New
                </Button>
            </div>
            <div className="p-2 space-y-2 overflow-auto">
                {isLoading && (
                    <div className="text-xs text-muted-foreground px-2 py-6 text-center">Loading charts…</div>
                )}
                {allCharts.length === 0 && !isLoading && (
                    <div className="text-xs text-muted-foreground px-2 py-6 text-center">No charts yet. Create one to get started.</div>
                )}
                {allCharts.map((chart) => {
                    const isSelected = chart.id === activeTab;
                    const type = chart.type as "line" | "heatmap" | null | undefined;
                    const createdAt = chart.createdAt ? new Date(chart.createdAt).toLocaleString() : "";
                    return (
                        <Card
                            key={chart.id}
                            className={`p-3 cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"}`}
                            onClick={() => setActiveTab(chart.id)}
                        >
                            <div className="flex items-start gap-2">
                                <div className="mt-1">
                                    {type === "line" ? (
                                        <Layers className="h-4 w-4" />
                                    ) : type === "heatmap" ? (
                                        <Grid3X3 className="h-4 w-4" />
                                    ) : (
                                        <Grid3X3 className="h-4 w-4 opacity-50" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium capitalize">
                                            {type ?? "empty"}
                                        </span>
                                        {createdAt && (
                                            <span className="text-xs text-muted-foreground">{createdAt}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground break-words">
                                        {chart.id.slice(0, 8)}…
                                    </p>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}