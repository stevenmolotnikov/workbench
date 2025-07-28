import { useWorkspace } from "@/stores/useWorkspace";
import { Loader2, Plus, X } from "lucide-react";
import { getHasLinkedConfig, getOrCreateLensCharts, getUnlinkedCharts } from "@/lib/queries/chartQueries";
import { useQuery } from "@tanstack/react-query";
import { useCreateChart, useDeleteChart } from "@/lib/api/chartApi";
import { useParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useMemo } from "react";
import { HeatmapChartWrapper } from "./types/HeatmapChartWrapper";
import { ChartData } from "@/types/charts";

export function ChartDisplay() {
    const { activeTab, setActiveTab } = useWorkspace();
    const { workspaceId } = useParams();

    const { mutateAsync: createChart, isPending: isCreatingChart } = useCreateChart();
    const { mutate: deleteChart } = useDeleteChart();

    const { data: charts, isLoading, isSuccess } = useQuery({
        queryKey: ["lensCharts", workspaceId],
        queryFn: () => getOrCreateLensCharts(workspaceId as string, {
            workspaceId: workspaceId as string,
        }),
    });

    const { data: unlinkedCharts } = useQuery({
        queryKey: ["unlinkedCharts", workspaceId],
        queryFn: () => getUnlinkedCharts(workspaceId as string),
    });

    const { data: hasLinkedConfig } = useQuery({
        queryKey: ["hasLinkedConfig", activeTab],
        queryFn: () => getHasLinkedConfig(activeTab as string),
        enabled: !!activeTab,
    });
    
    // On load, set to the first chart
    const initial = useRef(true);
    useEffect(() => {
        if (isSuccess && initial.current) {
            setActiveTab(charts[0].id);
            initial.current = false;
        }
    }, [isSuccess, charts, setActiveTab]);


    const handleNewTab = async () => {
        const newChart = await createChart({
            chart: {
                workspaceId: workspaceId as string,
            }, 
        });
        setActiveTab(newChart.id);
    };

    if (isLoading) return (
        <div className="flex-1 flex h-full items-center justify-center bg-muted">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );

    const allCharts = [...(charts || []), ...(unlinkedCharts || [])];
    const activeChart = allCharts?.find(c => c.id === activeTab);

    const handleCloseTab = (chartId: string) => {
        if (allCharts && allCharts.length > 1) {
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
        <div className="flex-1 flex h-full flex-col overflow-hidden custom-scrollbar bg-muted relative">
            <Tabs value={activeTab || ""} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-2 pt-1 flex items-center gap-1 bg-background">
                    <TabsList className="h-8 bg-transparent ">
                        {allCharts?.map((chart) => (
                            <div key={chart.id} className="inline-flex items-center group relative">
                                <TabsTrigger
                                    value={chart.id}
                                    className="data-[state=active]:bg-muted rounded-b-none h-8 pr-8 relative !shadow-none"
                                >
                                    <span className="px-2">
                                        Untitled Chart
                                    </span>
                                </TabsTrigger>
                                {allCharts.length > 1 && (
                                    <span
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-sm hover:bg-muted-foreground/20 flex items-center justify-center cursor-pointer z-10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCloseTab(chart.id);
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </span>
                                )}
                            </div>
                        ))}
                    </TabsList>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleNewTab}
                        disabled={activeTab === null || isCreatingChart || !hasLinkedConfig}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 p-4 overflow-auto custom-scrollbar">
                    {activeChart ? (
                        <div className="flex h-full w-full p-4">
                            <HeatmapChartWrapper chart={activeChart.data as ChartData} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">
                                {charts && charts.length === 0
                                    ? "No charts available. Create a chart from a completion card."
                                    : "Select a chart to run"}
                            </p>
                        </div>
                    )}
                </div>
            </Tabs>
        </div>
    );
}