"use client";

import { useQuery } from "@tanstack/react-query";
import { getChartsMetadata } from "@/lib/queries/chartQueries";
import { useParams, useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { useCreateLensChartPair, useCreatePatchChartPair, useDeleteChart } from "@/lib/api/chartApi";
import { useCreateDocument, useGetDocumentByWorkspace } from "@/lib/api/documentApi";
import ChartCard from "./ChartCard";
import { ChartMetadata } from "@/types/charts";

export default function ChartCardsSidebar() {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const router = useRouter();

    const { data: charts, isLoading: isChartsLoading } = useQuery<ChartMetadata[]>({
        queryKey: ["chartsForSidebar", workspaceId],
        queryFn: () => getChartsMetadata(workspaceId as string),
    });

    const { data: document, isLoading: isDocLoading } = useGetDocumentByWorkspace(workspaceId as string);

    const { mutate: createLensPair, isPending: isCreatingLens } = useCreateLensChartPair();
    const { mutate: createPatchPair, isPending: isCreatingPatch } = useCreatePatchChartPair();
    const { mutate: deleteChart } = useDeleteChart();
    const { mutate: createDocument, isPending: isCreatingOverview } = useCreateDocument();

    const navigateToChart = (chartId: string) => {
        router.push(`/workbench/${workspaceId}/${chartId}`);
    };

    const navigateToOverview = (documentId: string) => {
        router.push(`/workbench/${workspaceId}/overview/${documentId}`);
    };

    const handleCreate = (toolType: "lens" | "patch") => {
        const mutation = toolType === "lens" ? createLensPair : createPatchPair;
        mutation({
            workspaceId: workspaceId as string,
        }, {
            onSuccess: ({ chart }) => navigateToChart(chart.id)
        });
    };

    const handleDelete = (e: React.MouseEvent, chartId: string) => {
        e.stopPropagation();
        if (!charts || charts.length <= 1) return;
        // Choose next chart to focus
        const remaining = charts.filter(c => c.id !== chartId);
        const nextId = remaining[0]?.id;
        deleteChart(chartId, {
            onSuccess: () => {
                if (nextId) navigateToChart(nextId);
            }
        });
    };

    const handleOverviewClick = () => {
        if (document?.id) {
            navigateToOverview(document.id);
            return;
        }
        createDocument(workspaceId as string, {
            onSuccess: (created) => {
                if (created?.id) navigateToOverview(created.id);
            },
        });
    };


    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="h-12 px-3 py-2 border-b flex items-center justify-between">
                <span className="text-sm font-medium">Charts</span>
                <button
                    className="inline-flex items-center gap-1 h-8 text-xs px-2 py-1 rounded border hover:bg-muted"
                    onClick={handleOverviewClick}
                    disabled={isCreatingOverview || isDocLoading}
                    aria-label="Go to overview"
                    title="Overview"
                >
                    <FileText className="h-3 w-3" />
                    <span>Overview</span>
                </button>
            </div>
            <div className="p-2 space-y-2 overflow-auto">
                {isChartsLoading && (
                    <div className="text-xs text-muted-foreground px-2 py-6 text-center">Loading...</div>
                )}
                {(!charts || charts.length === 0) && !isChartsLoading && (
                    <div className="text-xs text-muted-foreground px-2 py-6 text-center">No charts yet. Create a chart to get started.</div>
                )}
                {charts?.map((chart) => {
                    const canDelete = (charts?.length || 0) > 1;
                    return (
                        <ChartCard  
                            key={chart.id}
                            metadata={chart}
                            handleDelete={handleDelete}
                            canDelete={canDelete}
                        />
                    );
                })}
                <div className="flex flex-row gap-2">
                    <button
                        className="w-full h-16 flex items-center text-xs border rounded border-dashed bg-muted/50 justify-center"
                        onClick={() => handleCreate("patch")}
                        disabled={isCreatingPatch}
                    >
                        <span>+ Patch</span>
                    </button>
                    <button
                        className="w-full h-16 flex items-center text-xs border rounded border-dashed bg-muted/50 justify-center"
                        onClick={() => handleCreate("lens")}
                        disabled={isCreatingLens}
                    >
                        <span>+ Lens</span>
                    </button>
                </div>
            </div>
        </div>
    );
}