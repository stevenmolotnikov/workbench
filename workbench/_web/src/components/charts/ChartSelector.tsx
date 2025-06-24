import { ChartMode } from "@/types/workspace";
import { useCharts } from "@/stores/useCharts";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useLensCompletions } from "@/stores/useLensCompletions";

import { SelectionMenu } from "./SelectionMenu";

export function ChartSelector({ modes }: { modes: ChartMode[] }) {
    const {
        layout,
        gridPositions,
        setChartMode,
        configuringPosition,
        setConfiguringPosition,
        selectionPhase,
        setSelectionPhase,
        selectedChartType,
        setSelectedChartType,
        pushCompletionId,
        completionIndex,
    } = useCharts();

    const { activeCompletions } = useLensCompletions.getState();

    const containerRef = useRef<HTMLDivElement>(null);
    const [containerHeight, setContainerHeight] = useState(0);

    function getCompatibleCharts() {
        const compatibleIndices: number[] = [];

        gridPositions.forEach((position, index) => {
            if (position.chartMode === undefined) return;

            // Line charts (index 0) can accept additional line chart data
            if (selectedChartType === 0 && position.chartMode === 0) {
                compatibleIndices.push(index);
            }
            // Heatmaps (index 1) can be replaced by any chart type
            else if (position.chartMode === 1 && selectedChartType === 1) {
                compatibleIndices.push(index);
            }
        });

        return compatibleIndices;
    }

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
        const columns = layout || 2;
        const padding = 32; // 1rem = 16px, and we have 2rem total padding (1rem on each side)

        if (containerHeight === 0) {
            // Fallback to original behavior while measuring
            return {
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gridAutoRows: "100%",
                gap: "1rem",
            };
        }

        const availableHeight = containerHeight - padding;
        // For 1 column: full container height, for multiple columns: half container height
        const chartHeight = columns === 1 ? availableHeight : availableHeight / 2;

        return {
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gridAutoRows: `${chartHeight}px`,
            gap: "0.5rem",
        };
    };

    const handleCreateNewChart = () => {
        if (configuringPosition === null || selectedChartType === null) return;

        setChartMode(configuringPosition, selectedChartType);
        setConfiguringPosition(null);
        setSelectionPhase(null);
        setSelectedChartType(null);
    };

    const handleSelectExistingChart = (chartIndex: number) => {
        const compatibleCharts = getCompatibleCharts();
        if (!compatibleCharts.includes(chartIndex)) return;

        // TODO: Implement logic to add/replace chart data
        // For now, just reset the state
        setConfiguringPosition(null);
        setSelectionPhase(null);
        setSelectedChartType(null);
        pushCompletionId(chartIndex, activeCompletions[completionIndex!].id);
        console.log(`Selected existing chart at index: ${chartIndex}`);
    };

    const isInDestinationSelectionMode = selectionPhase === "destination";

    return (
        <div className="flex-1 flex h-full flex-col overflow-hidden custom-scrollbar bg-muted relative">
            {/* Padded container for charts only */}
            <div ref={containerRef} className="flex-1 p-4 overflow-auto custom-scrollbar">
                {gridPositions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground border border-dashed rounded-lg">
                        <p className="text-sm">No charts added yet.</p>
                        <p className="text-xs mt-1">
                            Click the chart button in a completion card to add one.
                        </p>
                    </div>
                ) : (
                    <div style={getGridStyle()} className="custom-scrollbar">
                        {gridPositions.map((gridPosition, index) => {
                            const chartMode = gridPosition?.chartMode;

                            // Only render charts that have been configured
                            if (chartMode === undefined) {
                                return null;
                            }

                            const ChartComponent = modes[chartMode].component;
                            const compatibleCharts = getCompatibleCharts();
                            const isCompatible = compatibleCharts.includes(index);
                            const isClickable = isInDestinationSelectionMode;

                            return (
                                <div
                                    key={index}
                                    className={`h-full relative w-full min-w-0 max-w-full ${
                                        isClickable ? "cursor-pointer" : ""
                                    }`}
                                    onClick={() => isClickable && handleSelectExistingChart(index)}
                                >
                                    <div
                                        className={`h-full relative w-full min-w-0 max-w-full transition-all duration-200 ${
                                            isClickable && !isCompatible
                                                ? "opacity-30 pointer-events-none"
                                                : ""
                                        } ${
                                            isClickable && isCompatible
                                                ? "hover:ring-2 hover:ring-primary/50 hover:shadow-lg rounded-lg"
                                                : ""
                                        }`}
                                    >
                                        <ChartComponent index={index} />

                                        {/* Selection overlay */}
                                        {isClickable && isCompatible && (
                                            <div className="absolute inset-0 bg-primary/5 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                                <div className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium">
                                                    {selectedChartType === 0
                                                        ? "Add to chart"
                                                        : "Replace chart"}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Inline Chart Selector Overlay */}
            {configuringPosition !== null &&
                (selectionPhase === null || selectionPhase === "type") && (
                    <SelectionMenu modes={modes} setConfiguringPosition={setConfiguringPosition} />
                )}

            {/* Bottom Destination Selection Banner */}
            {isInDestinationSelectionMode && (
                <div className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">
                            {selectedChartType !== null && modes[selectedChartType]?.name} Selection
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {selectedChartType === 0
                                ? "Click a line chart to add data"
                                : "Click any chart to replace"}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleCreateNewChart} className="shadow-lg text-xs" >
                            New Chart <Plus className="w-6 h-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setSelectionPhase(null);
                                setSelectedChartType(null);
                                setConfiguringPosition(null);
                            }}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
