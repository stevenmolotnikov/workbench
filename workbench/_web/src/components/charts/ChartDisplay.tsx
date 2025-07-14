import { useEffect, useRef, useState } from "react";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { useCharts } from "@/stores/useCharts";
import { Button } from "@/components/ui/button";
import { ChartMode } from "@/types/workspace";
import { LogitLensModes } from "@/app/workbench/[workspace_id]/lens/page";
import { cn } from "@/lib/utils";

export function ChartDisplay() {
    const { activeCompletions } = useLensWorkspace();
    const { layout, setLayout } = useCharts();
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerHeight, setContainerHeight] = useState(0);

    // Filter completions that have a chart mode set
    const completionsWithCharts = activeCompletions.filter(c => c.chartMode !== undefined);

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

    const renderChart = (completion: any) => {
        if (!completion.chartData) {
            return (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm">Loading chart data...</p>
                </div>
            );
        }

        // Render chart directly based on type
        if (completion.chartData.type === "lineGraph") {
            const LineGraph = require("@/components/charts/primatives/LineGraph").LineGraph;
            return <LineGraph chartIndex={0} data={completion.chartData.data} />;
        } else if (completion.chartData.type === "heatmap") {
            const Heatmap = require("@/components/charts/primatives/Heatmap").Heatmap;
            return <Heatmap chartIndex={0} {...completion.chartData.data} />;
        }

        return null;
    };

    return (
        <div className="flex-1 flex h-full flex-col overflow-hidden custom-scrollbar bg-muted relative">
            {/* Layout controls */}
            <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Charts</h3>
                    <div className="flex gap-1">
                        <Button
                            variant={layout === 1 ? "default" : "outline"}
                            size="sm"
                            onClick={() => setLayout(1)}
                            className="h-7 px-2"
                        >
                            1
                        </Button>
                        <Button
                            variant={layout === 2 ? "default" : "outline"}
                            size="sm"
                            onClick={() => setLayout(2)}
                            className="h-7 px-2"
                        >
                            2
                        </Button>
                        <Button
                            variant={layout === 3 ? "default" : "outline"}
                            size="sm"
                            onClick={() => setLayout(3)}
                            className="h-7 px-2"
                        >
                            3
                        </Button>
                    </div>
                </div>
            </div>

            {/* Charts container */}
            <div ref={containerRef} className="flex-1 p-4 overflow-auto custom-scrollbar">
                {completionsWithCharts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground border border-dashed rounded-lg">
                        <p className="text-sm">No charts to display.</p>
                        <p className="text-xs mt-1">
                            Select a chart type in a completion card to visualize data.
                        </p>
                    </div>
                ) : (
                    <div style={getGridStyle()} className="custom-scrollbar">
                        {completionsWithCharts.map((completion) => {
                            const chartMode = LogitLensModes[completion.chartMode!];
                            
                            return (
                                <div
                                    key={completion.id}
                                    className="bg-card border rounded-lg overflow-hidden"
                                >
                                    <div className="border-b px-4 py-2 bg-muted/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <chartMode.icon className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">{completion.name}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {chartMode.name}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-[calc(100%-2.5rem)] p-4">
                                        {renderChart(completion)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}