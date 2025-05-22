import { useState } from "react";
import { X } from "lucide-react";
import { Plus } from "lucide-react";
import { Heatmap } from "@/components/charts/Heatmap";
import { ChartMode } from "@/types/workspace";
import { LineGraph } from "@/components/charts/LineGraph";
import { useLensWorkbench } from "@/stores/useLensWorkbench";
import { LineGraphData } from "@/types/lens";
import { ActivationPatchingResponse } from "@/types/patching";

import { SelectionMenu } from "./SelectionMenu";

interface ChartSelectorProps {
    modes: ChartMode[];
}

export function ChartSelector({
    modes,
}: ChartSelectorProps) {
    const [configuringPosition, setConfiguringPosition] = useState<number | null>(null);
    
    const { 
        layout, 
        gridPositions, 
        setChartType, 
        removeChart, 
        getGridPositionCount 
    } = useLensWorkbench();

    const isChartSelected = (modeIndex: number) => {
        return gridPositions.some(pos => pos.chartType === modeIndex);
    };

    const getLayoutGrid = () => {
        switch (layout) {
            case "1x1":
                return "grid-cols-1";
            case "2x1":
                return "grid-rows-2";
            default:
                return "grid-cols-1";
        }
    };

    const handleAddChart = (modeIndex: number) => {
        if (configuringPosition === null) return;

        setChartType(configuringPosition, modeIndex);
        setConfiguringPosition(null);
    };

    const handleRemoveChart = (position: number) => {
        removeChart(position);
    };

    const isActivationPatchingResponse = (data: unknown): data is ActivationPatchingResponse => {
        return data !== null && 
               typeof data === 'object' && 
               'results' in data && 
               'rowLabels' in data && 
               'colLabels' in data;
    };

    const isLineGraphData = (data: unknown): data is LineGraphData => {
        return data !== null && 
               typeof data === 'object' && 
               'chartData' in data && 
               'chartConfig' in data && 
               'maxLayer' in data;
    };

    return (
        <div className="flex-1 flex h-full flex-col overflow-hidden custom-scrollbar bg-muted relative">
            {/* Padded container for charts only */}
            <div className="flex-1 overflow-auto p-4 ">
                <div className={`grid ${getLayoutGrid()} gap-4 h-full`}>
                    {Array.from({ length: getGridPositionCount() }).map((_, index) => {
                        const gridPosition = gridPositions[index];
                        const hasChart = gridPosition?.chartType !== undefined;
                        
                        return (
                            <div key={index} className="h-full relative">
                                {hasChart ? (
                                    <div className="h-full">
                                        <button
                                            onClick={() => handleRemoveChart(index)}
                                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors z-10"
                                        >
                                            <X className="h-4 w-4 text-muted-foreground" />
                                        </button>

                                        {gridPosition.isLoading ? (
                                            <div className="flex items-center justify-center h-full">
                                                <div className="text-muted-foreground">Loading...</div>
                                            </div>
                                        ) : modes[gridPosition.chartType!].chartType === "heatmap" ? (
                                            isActivationPatchingResponse(gridPosition.chartData) ? (
                                                <Heatmap
                                                    data={gridPosition.chartData.results}
                                                    rowLabels={gridPosition.chartData.rowLabels}
                                                    colLabels={gridPosition.chartData.colLabels}
                                                    activeAnnotation={null}
                                                    setActiveAnnotation={() => {}}
                                                    annotations={[]}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <div className="text-muted-foreground">Invalid heatmap data</div>
                                                </div>
                                            )
                                        ) : (
                                            isLineGraphData(gridPosition.chartData) ? (
                                                <LineGraph
                                                    data={gridPosition.chartData}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <div className="text-muted-foreground">Invalid line graph data</div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        className="flex flex-col items-center justify-center h-full border border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => {
                                            setConfiguringPosition(index);
                                        }}
                                    >
                                        <div className="flex items-center gap-1">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Add a chart
                                            </p>
                                            <Plus className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Inline Chart Selector Overlay */}
            {configuringPosition !== null && (
                <SelectionMenu
                    modes={modes}
                    setConfiguringPosition={setConfiguringPosition}
                    isChartSelected={isChartSelected}
                    handleAddChart={handleAddChart}
                />
            )}
        </div>
    );
}
