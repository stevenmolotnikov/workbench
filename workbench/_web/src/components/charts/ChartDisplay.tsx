import { useEffect, useRef, useState } from "react";
import { useWorkspace } from "@/stores/useWorkspace";
import { Loader2, Plus, X } from "lucide-react";
import { getLensCharts } from "@/lib/queries/chartQueries";
import { useQuery } from "@tanstack/react-query";
import { useCreateChart, useDeleteChart } from "@/lib/api/chartApi";
import { useParams } from "next/navigation";
import { ChartCard } from "./ChartCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export function ChartDisplay() {
    const { activeTab, setActiveTab } = useWorkspace();
    
    const containerRef = useRef<HTMLDivElement>(null);

    const { workspaceId } = useParams();

    const { data: charts, isLoading } = useQuery({
        queryKey: ["lensCharts", workspaceId],
        queryFn: () => getLensCharts(workspaceId as string),
    });

    const createChartMutation = useCreateChart();
    const deleteChartMutation = useDeleteChart();


    const handleNewTab = async () => {
        console.log("Setting activeTab to null");
        setActiveTab(null);
    };

    const handleCloseTab = (chartId: string) => {
        if (charts && charts.length > 1) {
            // Find next tab to activate
            const chartIndex = charts.findIndex(c => c.id === chartId);
            if (activeTab === chartId) {
                const nextIndex = chartIndex === charts.length - 1 ? chartIndex - 1 : chartIndex + 1;
                setActiveTab(charts[nextIndex].id);
            }
            deleteChartMutation.mutate(chartId);
        }
    };

    const activeChart = charts?.find(c => c.id === activeTab);

    const getGridStyle = () => {
        return {
            display: "flex",
            height: "100%",
            width: "100%",
        };
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex h-full items-center justify-center bg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex h-full flex-col overflow-hidden custom-scrollbar bg-muted relative">
            <Tabs value={activeTab === null ? "new" : activeTab} onValueChange={(value) => value !== "new" && setActiveTab(value)} className="flex-1 flex flex-col">
                <div className="px-2 pt-1 flex items-center gap-1 bg-background">
                    <TabsList className="h-8 bg-transparent ">
                        {charts?.map((chart) => (
                            <div key={chart.id} className="inline-flex items-center group relative">
                                <TabsTrigger  
                                    value={chart.id} 
                                    className="data-[state=active]:bg-muted rounded-b-none h-8 pr-8 relative !shadow-none"
                                >
                                    <span className="px-2">
                                        Untitled Chart
                                    </span>
                                </TabsTrigger>
                                {charts.length > 1 && (
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
                        {activeTab === null && (
                            <div className="inline-flex items-center relative">
                                <TabsTrigger 
                                    value="new" 
                                    className="data-[state=active]:bg-muted rounded-b-none h-8 !shadow-none pr-8"
                                >
                                    <span className="px-2 italic text-muted-foreground">
                                        New Chart
                                    </span>
                                </TabsTrigger>
                                <span
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-sm hover:bg-muted-foreground/20 flex items-center justify-center cursor-pointer z-10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (charts && charts.length > 0) {
                                            setActiveTab(charts[0].id);
                                        }
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                </span>
                            </div>
                        )}
                    </TabsList>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleNewTab}
                        disabled={activeTab === null || createChartMutation.isPending}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div ref={containerRef} className="flex-1 p-4 overflow-auto custom-scrollbar">
                    {activeChart ? (
                        <div style={getGridStyle()}>
                            <ChartCard 
                                key={activeChart.id} 
                                isLoading={false}
                                chartId={activeChart.id}
                                chart={
                                    <div>hello</div>
                                }
                            />
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