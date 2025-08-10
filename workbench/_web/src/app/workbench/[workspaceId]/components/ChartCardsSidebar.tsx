"use client";

import { useQuery } from "@tanstack/react-query";
import { getChartsForSidebar, type ToolTypedChart } from "@/lib/queries/chartQueries";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid3X3, ChartLine, Plus, Search, ReplaceAll } from "lucide-react";
import { useWorkspace } from "@/stores/useWorkspace";
import { useCreateLensChartPair } from "@/lib/api/chartApi";

export default function ChartCardsSidebar() {
    const { workspaceId } = useParams();
    const { activeTab, setActiveTab, selectedModel } = useWorkspace();

    const { data: charts, isLoading } = useQuery<ToolTypedChart[]>({
        queryKey: ["chartsForSidebar", workspaceId],
        queryFn: () => getChartsForSidebar(workspaceId as string),
    });

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

    if (!charts) return null;

    const formatToolType = (toolType: ToolTypedChart["toolType"]) => {
        if (!toolType) return "Unknown";
        return toolType === "lens" ? "Lens" : toolType === "patch" ? "Patch" : toolType;
    };

    const renderToolIcon = (toolType: ToolTypedChart["toolType"]) => {
        if (toolType === "lens") return <Search className="h-4 w-4" />;
        if (toolType === "patch") return <ReplaceAll className="h-4 w-4" />;
        return <Search className="h-4 w-4 opacity-50" />;
    };

    const renderChartTypeMini = (chartType: ToolTypedChart["chartType"]) => {
        if (chartType === "line") return (
            <span className="inline-flex items-center gap-1">
                <ChartLine className="h-3 w-3" />
                <span>Line</span>
            </span>
        );
        if (chartType === "heatmap") return (
            <span className="inline-flex items-center gap-1">
                <Grid3X3 className="h-3 w-3" />
                <span>Heatmap</span>
            </span>
        );
        return (
            <span className="inline-flex items-center gap-1 opacity-60">
                <Grid3X3 className="h-3 w-3" />
                <span>unknown</span>
            </span>
        );
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
                {charts.length === 0 && !isLoading && (
                    <div className="text-xs text-muted-foreground px-2 py-6 text-center">No charts yet. Create one to get started.</div>
                )}
                {charts.map((chart) => {
                    const isSelected = chart.id === activeTab;
                    const createdAt = chart.createdAt ? new Date(chart.createdAt).toLocaleDateString() : "";
                    return (
                        <Card
                            key={chart.id}
                            className={`p-3 cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"}`}
                            onClick={() => setActiveTab(chart.id)}
                        >
                            <div className="flex items-start gap-2">
                                <div className="mt-1">
                                    {renderToolIcon(chart.toolType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium capitalize">
                                            {formatToolType(chart.toolType)}
                                        </span>
                                        {createdAt && (
                                            <span className="text-xs text-muted-foreground">{createdAt}</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground break-words flex items-center gap-2">
                                        <span>
                                            {chart.annotationCount} {chart.annotationCount === 1 ? "annotation" : "annotations"}
                                        </span>
                                        <span className="opacity-60">•</span>
                                        {renderChartTypeMini(chart.chartType)}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
