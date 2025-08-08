import { useWorkspace } from "@/stores/useWorkspace";
import { Loader2, PanelRight, PanelRightClose, Plus, X } from "lucide-react";
import { getOrCreateLensCharts } from "@/lib/queries/chartQueries";
import { useQuery } from "@tanstack/react-query";
import { useCreateChart, useDeleteChart } from "@/lib/api/chartApi";
import { useParams } from "next/navigation";
import { useEffect, useRef, useMemo } from "react";
import { HeatmapData, LineGraphData } from "@/types/charts";
import { TooltipButton } from "../ui/tooltip-button";
import { cn } from "@/lib/utils";

import { HeatmapCard } from "./heatmap/HeatmapCard";
import { LineCard } from "./line/LineCard";
import { Button } from "../ui/button";

export function ChartDisplay() {
    const { activeTab, setActiveTab, setAnnotationsOpen, annotationsOpen } = useWorkspace();
    const { workspaceId } = useParams();


    const { mutateAsync: createChart, isPending: isCreatingChart } = useCreateChart();
    const { mutate: deleteChart } = useDeleteChart();

    const { data: { lensCharts, unlinkedCharts } = { lensCharts: [], unlinkedCharts: [] }, isLoading, isSuccess } = useQuery({
        queryKey: ["lensCharts"],
        queryFn: () => getOrCreateLensCharts(workspaceId as string, {
            workspaceId: workspaceId as string,
        }),
    });

    const allCharts = useMemo(() => {
        return [...(lensCharts || []), ...(unlinkedCharts || [])];
    }, [lensCharts, unlinkedCharts]);

    const activeChart = useMemo(() => {
        return allCharts?.find(c => c.id === activeTab);
    }, [allCharts, activeTab]);

    const multipleTabs = allCharts.length > 1;

    // On load, set to the first chart
    const initial = useRef(true);
    useEffect(() => {
        if (isSuccess && initial.current) {
            setActiveTab(allCharts[0].id);
            initial.current = false;
        }
    }, [isSuccess, allCharts, setActiveTab]);

    const handleNewTab = async () => {
        const newChart = await createChart({
            chart: {
                workspaceId: workspaceId as string,
            },
        });
        setActiveTab(newChart.id);
    };

    if (isLoading || !activeChart) return (
        <div className="flex-1 flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );

    const handleCloseTab = (chartId: string) => {
        if (multipleTabs) {
            // Find next tab to activate
            const chartIndex = allCharts.findIndex(c => c.id === chartId);
            if (activeTab === chartId) {
                const nextIndex = chartIndex === allCharts.length - 1 ? chartIndex - 1 : chartIndex + 1;
                setActiveTab(allCharts[nextIndex].id);
            }
            deleteChart(chartId);
        }
    };

    return (
        <div className="flex-1 flex h-full flex-col overflow-hidden custom-scrollbar relative">
            {/* Tabs */}
            <div className="px-2 py-2 flex items-center bg-background justify-between h-12 border-b">
                {/* Tabs List */}
                <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1">
                        {allCharts?.map((chart) => (
                            // Individual tab
                            <div key={chart.id} className="relative group">
                                <button
                                    onClick={() => setActiveTab(chart.id)}
                                    className={cn(
                                        "inline-flex items-center px-3 py-1 rounded-md transition-colors",
                                        "group-hover:bg-muted/50",
                                        multipleTabs && "pr-8",
                                        activeTab === chart.id
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    Untitled Chart
                                </button>
                                {multipleTabs && (
                                    <button
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-sm flex items-center justify-center cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCloseTab(chart.id);
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {/* New Tab Button */}
                    <TooltipButton
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex items-center justify-center"
                        tooltip={"Create a new chart"}
                        onClick={handleNewTab}
                        disabled={activeTab === null || isCreatingChart || unlinkedCharts.length > 0}
                    >
                        <Plus className="h-4 w-4" />
                    </TooltipButton>
                </div>

                <Button variant="ghost" size="icon" className="h-8 w-8 flex items-center justify-center" onClick={() => {
                    setAnnotationsOpen(!annotationsOpen);
                }}>
                    {
                        annotationsOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />
                    }

                </Button>
            </div>

            {/* Tab Content */}

            {activeChart.type === "heatmap" && (activeChart.data !== null) ? (
                <HeatmapCard data={activeChart.data as HeatmapData} />
            ) : activeChart.data !== null ? (
                <LineCard data={activeChart.data as LineGraphData} />
            ) : (
                <div className="flex-1 flex h-full items-center justify-center">
                    <div className="text-muted-foreground">No data available</div>
                </div>
            )}

        </div>
    );
}