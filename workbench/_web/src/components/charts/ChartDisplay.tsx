import { useEffect, useRef, useState } from "react";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { useCharts } from "@/stores/useCharts";
import { Button } from "@/components/ui/button";
import { ChartMode } from "@/types/workspace";
import { LogitLensModes } from "@/app/workbench/[workspace_id]/lens/page";
import { cn } from "@/lib/utils";
import { useStatusUpdates } from "@/hooks/useStatusUpdates";
import { Loader2 } from "lucide-react";
import type { ChartData } from "@/stores/useCharts";

export function ChartDisplay() {
    const { completions } = useLensWorkspace();
    const { layout, setLayout } = useCharts();
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerHeight, setContainerHeight] = useState(0);
    const [chartData, setChartData] = useState<Record<string, ChartData>>({});
    const [loadingCharts, setLoadingCharts] = useState<Set<string>>(new Set());

    // Filter completions that have a chart mode set
    const completionsWithCharts = completions.filter(c => c.chartMode !== undefined);

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

    const fetchChartData = async (completion: any) => {
        const { startStatusUpdates, stopStatusUpdates } = useStatusUpdates.getState();
        const jobId = `chart-${completion.id}-${Date.now()}`;
        
        setLoadingCharts(prev => new Set(prev).add(completion.id));
        startStatusUpdates(jobId);

        try {
            const chartMode = LogitLensModes[completion.chartMode];
            
            if (chartMode.name === "Target Token") {
                // Line graph - uses all prompts with target tokens
                const promptsWithTargets = completion.prompts.filter(p => 
                    p.tokens && p.tokens.some(t => t.target_id >= 0)
                );

                const completions = promptsWithTargets.map(prompt => ({
                    ...completion,
                    prompt: prompt.text,
                    tokens: prompt.tokens || [],
                    name: prompt.name || `Prompt ${completion.prompts.indexOf(prompt) + 1}`
                }));

                const response = await fetch("/api/lens-line", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ completions, job_id: jobId }),
                });

                if (!response.ok) throw new Error(response.statusText);
                const data = await response.json();
                setChartData(prev => ({ ...prev, [completion.id]: { type: "lineGraph", data } }));
                
            } else if (chartMode.name === "Prediction Grid") {
                // Heatmap - uses first prompt with text
                const selectedPrompt = completion.prompts.find(p => p.text) || completion.prompts[0];
                
                const response = await fetch("/api/lens-grid", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        completion: {
                            ...completion,
                            prompt: selectedPrompt.text,
                            tokens: selectedPrompt.tokens || []
                        },
                        job_id: jobId,
                    }),
                });

                if (!response.ok) throw new Error(response.statusText);
                const data = await response.json();
                setChartData(prev => ({ ...prev, [completion.id]: { type: "heatmap", data } }));
            }
        } catch (error) {
            console.error("Error fetching chart data:", error);
            setChartData(prev => {
                const newData = { ...prev };
                delete newData[completion.id];
                return newData;
            });
        } finally {
            setLoadingCharts(prev => {
                const newSet = new Set(prev);
                newSet.delete(completion.id);
                return newSet;
            });
            stopStatusUpdates();
        }
    };

    // Auto-fetch chart data when completions change
    useEffect(() => {
        completionsWithCharts.forEach(completion => {
            if (!chartData[completion.id] && !loadingCharts.has(completion.id)) {
                fetchChartData(completion);
            }
        });
    }, [completionsWithCharts]);

    const renderChart = (completion: any) => {
        const data = chartData[completion.id];
        
        if (!data || loadingCharts.has(completion.id)) {
            return (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <p className="text-sm">Loading chart data...</p>
                    </div>
                </div>
            );
        }

        // Render chart directly based on type
        if (data.type === "lineGraph") {
            const LineGraph = require("@/components/charts/primatives/LineGraph").LineGraph;
            return <LineGraph chartIndex={0} data={data.data} />;
        } else if (data.type === "heatmap") {
            const Heatmap = require("@/components/charts/primatives/Heatmap").Heatmap;
            return <Heatmap chartIndex={0} {...data.data} />;
        }

        return null;
    };

    return (
        <div className="flex-1 flex h-full flex-col overflow-hidden custom-scrollbar bg-muted relative">
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