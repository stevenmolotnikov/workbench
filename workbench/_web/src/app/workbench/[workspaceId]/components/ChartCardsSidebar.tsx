"use client";

import { useQuery } from "@tanstack/react-query";
import { getChartsMetadata } from "@/lib/queries/chartQueries";
import { useParams, useRouter } from "next/navigation";
import { useCreateLensChartPair, useCreatePerplexChartPair, useDeleteChart } from "@/lib/api/chartApi";
import { useCreateDocument, useDeleteDocument, useGetDocumentsForWorkspace } from "@/lib/api/documentApi";
import ChartCard from "./ChartCard";
import ReportCard from "./ReportCard";
import { ChartMetadata } from "@/types/charts";
import type { DocumentListItem } from "@/lib/queries/documentQueries";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

export default function ChartCardsSidebar() {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const router = useRouter();

    const { data: charts, isLoading: isChartsLoading } = useQuery<ChartMetadata[]>({
        queryKey: ["chartsForSidebar", workspaceId],
        queryFn: () => getChartsMetadata(workspaceId as string),
    });

    const { data: reports, isLoading: isReportsLoading } = useGetDocumentsForWorkspace(workspaceId as string);

    const { mutate: createLensPair, isPending: isCreatingLens } = useCreateLensChartPair();
    const { mutate: createPerplexPair, isPending: isCreatingPerplex } = useCreatePerplexChartPair();
    const { mutate: deleteChart } = useDeleteChart();
    const { mutate: createDocument, isPending: isCreatingDocument } = useCreateDocument();
    const { mutate: deleteDocument } = useDeleteDocument();

    const listRef = useRef<HTMLDivElement | null>(null);
    const cardsRef = useRef<HTMLDivElement | null>(null);
    const buttonsMeasureRef = useRef<HTMLDivElement | null>(null);
    const [canInlineButtons, setCanInlineButtons] = useState(true);

    useEffect(() => {
        const listEl = listRef.current;
        const cardsEl = cardsRef.current;
        if (!listEl || !cardsEl) return;

        const recompute = () => {
            const scrollAreaHeight = listEl.clientHeight;
            const cardsHeight = cardsEl.scrollHeight;
            const buttonsHeight = buttonsMeasureRef.current?.offsetHeight ?? 0;
            const fitsInline = cardsHeight + buttonsHeight <= scrollAreaHeight;
            setCanInlineButtons(fitsInline);
        };

        // Initial compute
        recompute();

        const listObserver = new ResizeObserver(recompute);
        const cardsObserver = new ResizeObserver(recompute);
        listObserver.observe(listEl);
        cardsObserver.observe(cardsEl);

        const onResize = () => recompute();
        window.addEventListener("resize", onResize);

        return () => {
            listObserver.disconnect();
            cardsObserver.disconnect();
            window.removeEventListener("resize", onResize);
        };
    }, [charts, reports]);

    const navigateToChart = (chartId: string) => {
        router.push(`/workbench/${workspaceId}/${chartId}`);
    };

    const navigateToOverview = (documentId: string) => {
        router.push(`/workbench/${workspaceId}/overview/${documentId}`);
    };

    const handleCreate = (toolType: "lens" | "perplex") => {
        const mutation = toolType === "lens" ? createLensPair : createPerplexPair;
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
        // Option A: prevent multiple empty reports
        const empty = (reports || []).find((r) => r.derivedTitle === "");
        if (empty) {
            navigateToOverview(empty.id);
            return;
        }
        createDocument(workspaceId as string, {
            onSuccess: (created) => {
                if (created?.id) navigateToOverview(created.id);
            },
        });
    };

    const handleDeleteReport = (e: React.MouseEvent, reportId: string) => {
        e.stopPropagation();
        deleteDocument({ workspaceId: workspaceId as string, documentId: reportId }, {
            onSuccess: () => {
                // If the current route is the deleted report, navigate to first chart if any
                const firstChartId = charts && charts.length > 0 ? charts[0].id : null;
                if (firstChartId) {
                    navigateToChart(firstChartId);
                }
            },
        });
    };

    const ActionButtons = () => (
        <div className="flex flex-col w-full gap-3 text-sm">
            <div className="flex flex-row w-full gap-3">
                <Button
                    variant="outline"
                    onClick={() => handleCreate("lens")}
                    disabled={isCreatingPerplex || isCreatingDocument}
                    className="flex-1"
                >
                    {
                        isCreatingLens ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />
                    }
                    <span>Lens</span>
                </Button>
                <Button
                    variant="outline"
                    onClick={() => handleCreate("perplex")}
                    disabled={isCreatingLens || isCreatingDocument}
                    className="flex-1"
                >
                    {
                        isCreatingPerplex ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />
                    }
                    <span>Perplex</span>
                </Button>
            </div>
            <div className="flex flex-row w-full gap-3">
                <Button
                    variant="outline"
                    onClick={handleOverviewClick}
                    disabled={isCreatingLens || isCreatingPerplex}
                    className="flex-1"
                >
                    {
                        isCreatingDocument ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />
                    }
                    <span>Report</span>
                </Button>
            </div>
        </div>
    );


    return (
        <div className="flex h-full flex-col w-[20vw] p-3 pt-0 relative">
            <div ref={listRef} className="flex-1 scrollbar-hide overflow-auto">
                <div ref={cardsRef} className="space-y-3">
                {(isChartsLoading || isReportsLoading) && (
                    <>
                        <div className="h-24 bg-card animate-pulse rounded" />
                        <div className="h-24 bg-card animate-pulse rounded" />
                        <div className="h-24 bg-card animate-pulse rounded" />
                    </>
                )}
                {(!charts || charts.length === 0) && (!reports || reports.length === 0) && !isChartsLoading && !isReportsLoading && (
                    <div className="text-xs text-muted-foreground px-3 py-6 text-center">No charts or reports yet. Create one to get started.</div>
                )}
                {(charts && reports) && (
                    [...charts.map((c) => ({ type: "chart" as const, item: c })), ...reports.map((r) => ({ type: "report" as const, item: r }))]
                        .sort((a, b) => {
                            const aTime = a.type === "chart" ? new Date(a.item.createdAt).getTime() : new Date(a.item.createdAt).getTime();
                            const bTime = b.type === "chart" ? new Date(b.item.createdAt).getTime() : new Date(b.item.createdAt).getTime();
                            return bTime - aTime; // newest first
                        })
                        .map((entry) => {
                            if (entry.type === "chart") {
                                const chart = entry.item as ChartMetadata;
                                const canDelete = (charts?.length || 0) > 1;
                                return (
                                    <ChartCard
                                        key={`chart-${chart.id}`}
                                        metadata={chart}
                                        handleDelete={handleDelete}
                                        canDelete={canDelete}
                                    />
                                );
                            }
                            const report = entry.item as DocumentListItem;
                            return (
                                <ReportCard
                                    key={`report-${report.id}`}
                                    report={report}
                                    onClick={() => navigateToOverview(report.id)}
                                    onDelete={(e) => handleDeleteReport(e, report.id)}
                                />
                            );
                        })
                )}
                </div>
                {canInlineButtons && (
                    <div className="pt-3">
                        <ActionButtons />
                    </div>
                )}
            </div>
            {!canInlineButtons && (
                <div className="pt-3 shrink-0">
                    <ActionButtons />
                </div>
            )}
            {/* Hidden measure for buttons height to avoid layout feedback */}
            <div className="absolute opacity-0 -z-10 pointer-events-none" ref={buttonsMeasureRef}>
                <ActionButtons />
            </div>
        </div>
    );
}