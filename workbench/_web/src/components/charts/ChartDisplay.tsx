import { useWorkspace } from "@/stores/useWorkspace";
import { Loader2, PanelRight, PanelRightClose } from "lucide-react";
import { getOrCreateLensCharts } from "@/lib/queries/chartQueries";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { HeatmapData, LineGraphData } from "@/types/charts";

import { HeatmapCard } from "./heatmap/HeatmapCard";
import { LineCard } from "./line/LineCard";
import { Button } from "../ui/button";

export function ChartDisplay() {
    const { activeTab, setActiveTab, setAnnotationsOpen, annotationsOpen } = useWorkspace();
    const { workspaceId } = useParams();

    const { data: { lensCharts, unlinkedCharts } = { lensCharts: [], unlinkedCharts: [] }, isLoading, isSuccess } = useQuery({
        queryKey: ["lensCharts", workspaceId],
        queryFn: () => getOrCreateLensCharts(workspaceId as string, {
            workspaceId: workspaceId as string,
        }),
    });

    const allCharts = useMemo(() => {
        return [...(lensCharts || []), ...(unlinkedCharts || [])];
    }, [lensCharts, unlinkedCharts]);

    const activeChart = useMemo(() => {
        return allCharts?.find(c => c.id === activeTab) || null;
    }, [allCharts, activeTab]);

    // On load, set to the first chart
    const initial = useRef(true);
    useEffect(() => {
        if (isSuccess && initial.current && allCharts.length > 0) {
            setActiveTab(allCharts[0].id);
            initial.current = false;
        }
    }, [isSuccess, allCharts, setActiveTab]);

    if (isLoading) return (
        <div className="flex-1 flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );

    return (
        <div className="flex-1 flex h-full flex-col overflow-hidden custom-scrollbar relative">
            <div className="px-2 py-2 flex items-center bg-background justify-end h-12 border-b">
                <Button variant="ghost" size="icon" className="h-8 w-8 flex items-center justify-center" onClick={() => {
                    setAnnotationsOpen(!annotationsOpen);
                }}>
                    {annotationsOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
                </Button>
            </div>

            {activeChart && activeChart.type === "heatmap" && (activeChart.data !== null) ? (
                <HeatmapCard data={activeChart.data as HeatmapData} />
            ) : activeChart && activeChart.data !== null ? (
                <LineCard data={activeChart.data as LineGraphData} />
            ) : (
                <div className="flex-1 flex h-full items-center justify-center">
                    <div className="text-muted-foreground">No chart selected</div>
                </div>
            )}
        </div>
    );
}