import { useEffect, useRef, useState } from "react";
import { useWorkspace } from "@/stores/useWorkspace";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { LineChartWrapper } from "./types/LineChartWrapper";
import { HeatmapChartWrapper } from "./types/HeatmapChartWrapper";
import { getLensCharts } from "@/lib/queries/chartQueries";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ChartCard } from "./ChartCard";

export function ChartDisplay() {
    const { layout } = useWorkspace();
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerHeight, setContainerHeight] = useState(0);

    const { workspaceId } = useParams();

    const { data: charts, isLoading } = useQuery({
        queryKey: ["lensCharts", workspaceId],
        queryFn: () => getLensCharts(workspaceId as string),
    });

    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setContainerHeight(rect.height);
            }
        };

        updateHeight();
        window.addEventListener("resize", updateHeight);

        return () => window.removeEventListener("resize", updateHeight);
    }, []);

    const getGridStyle = () => {
        const columns = layout || 1;
        const padding = 32; // 2rem total padding

        if (containerHeight === 0) {
            return {
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gridAutoRows: "100%",
                gap: "1rem",
            };
        }

        const availableHeight = containerHeight - padding;
        const chartHeight = columns === 1 ? availableHeight : availableHeight / 2;

        return {
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gridAutoRows: `${chartHeight}px`,
            gap: "0.5rem",
        };
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex h-full items-center justify-center bg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Sort charts by position
    const sortedCharts = charts?.sort((a, b) => a.position - b.position) || [];

    return (
        <div className="flex-1 flex h-full flex-col overflow-hidden custom-scrollbar bg-muted relative">
            {/* Charts container */}
            {/* {JSON.stringify(sortedCharts)}
            {sortedCharts.length} */}
            <div ref={containerRef} className="flex-1 p-4 overflow-auto custom-scrollbar">
                {sortedCharts.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No charts to display</p>
                    </div>
                ) : (
                    <div style={getGridStyle()}>
                        {sortedCharts.map((chart) => (
                            <ChartCard 
                                key={chart.id} 
                                isLoading={false}
                                chartId={chart.id}
                                chart={
                                    <div>hello</div>
                                    // chart.chartType === "line" ? (
                                    //     <LineChartWrapper chart={chart} />
                                    // ) : (
                                    //     <HeatmapChartWrapper chart={chart} />
                                    // )
                                    // <HeatmapChartWrapper chart={chart} />
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}