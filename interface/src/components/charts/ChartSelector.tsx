import { useState } from "react";
import { X } from "lucide-react";
import { Layout } from "@/types/workspace";
import { Plus } from "lucide-react";
import { LineGraphData } from "@/types/lens";
import { Heatmap } from "@/components/charts/Heatmap";
import { ChartMode } from "@/types/workspace";
import { ActivationPatchingResponse } from "@/types/patching";
import { LineGraph } from "@/components/charts/LineGraph";

import { SelectionMenu } from "./SelectionMenu";

interface ChartSelectorProps {
    layout: Layout;
    chartData: LineGraphData | ActivationPatchingResponse | null;
    isLoading: boolean;
    setChartData: (data: LineGraphData | null) => void;
    modes: ChartMode[];
}

export function ChartSelector({
    layout,
    chartData,
    isLoading,
    setChartData,
    modes,
}: ChartSelectorProps) {
    const [selectedModes, setSelectedModes] = useState<(number | undefined)[]>([]);
    const [configuringPosition, setConfiguringPosition] = useState<number | null>(null);

    const isChartSelected = (modeIndex: number) => {
        return selectedModes.includes(modeIndex);
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

    const getBoxCount = () => {
        switch (layout) {
            case "1x1":
                return 1;
            case "2x1":
                return 2;
            default:
                return 1;
        }
    };

    const handleAddChart = (modeIndex: number) => {
        if (configuringPosition === null) return;

        setSelectedModes((prev) => {
            const newModes = [...prev];
            newModes[configuringPosition] = modeIndex;
            return newModes;
        });
        setConfiguringPosition(null);
    };

    const handleRemoveChart = (position: number) => {
        setSelectedModes((prev) => {
            const newModes = [...prev];
            newModes[position] = undefined;
            return newModes;
        });
        setChartData(null);
    };

    return (
        <div className="flex-1 flex h-full flex-col overflow-hidden custom-scrollbar bg-muted relative">
            {/* Padded container for charts only */}
            <div className="flex-1 overflow-auto p-4 ">
                <div className={`grid ${getLayoutGrid()} gap-4 h-full`}>
                    {Array.from({ length: getBoxCount() }).map((_, index) => (
                        <div key={index} className="h-full relative">
                            {selectedModes[index] !== undefined ? (
                                <div className="h-full">
                                    <button
                                        onClick={() => handleRemoveChart(index)}
                                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors z-10"
                                    >
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </button>

                                    {modes[selectedModes[index]!].chartType === "heatmap" ? (
                                        <Heatmap
                                            data={chartData?.results}
                                            rowLabels={chartData?.rowLabels}
                                            colLabels={chartData?.colLabels}
                                        />
                                    ) : (
                                        <LineGraph
                                            data={chartData}
                                            // isLoading={isLoading}
                                        />
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
                    ))}
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
