import { useState } from "react";
import { Plus } from "lucide-react";
import { ChartMode } from "@/types/workspace";
import { useCharts } from "@/stores/useCharts";

import { SelectionMenu } from "./SelectionMenu";

const EmptyChart = ({
    handleSetConfiguringPosition,
}: {
    handleSetConfiguringPosition: () => void;
}) => (
    <div
        className="flex flex-col items-center justify-center h-full border border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={handleSetConfiguringPosition}
    >
        <div className="flex items-center gap-1">
            <p className="text-sm font-medium text-muted-foreground">Add a chart</p>
            <Plus className="h-4 w-4 text-muted-foreground" />
        </div>
    </div>
);

export function ChartSelector({ modes }: { modes: ChartMode[] }) {
    const [configuringPosition, setConfiguringPosition] = useState<number | null>(null);

    const { layout, gridPositions, setChartMode } = useCharts();

    const isChartSelected = (modeIndex: number) => {
        return gridPositions.some((pos) => pos.chartMode === modeIndex);
    };

    const getLayoutGrid = () => {
        switch (layout) {
            case "1x1":
                return "grid-cols-1";
            case "2x1":
                return "grid-rows-2";
            case "2x2":
                return "grid-cols-2 grid-rows-2";
            default:
                return "grid-cols-1";
        }
    };

    const handleAddChart = (modeIndex: number) => {
        if (configuringPosition === null) return;

        setChartMode(configuringPosition, modeIndex);
        setConfiguringPosition(null);
    };

    return (
        <div className="flex-1 flex h-full flex-col overflow-hidden custom-scrollbar bg-muted relative">
            {/* Padded container for charts only */}
            <div className="flex-1 overflow-auto p-4 ">
                <div className={`grid ${getLayoutGrid()} gap-4 h-full`}>
                    {Array.from({ length: gridPositions.length }).map((_, index) => {
                        const gridPosition = gridPositions[index];
                        const chartMode = gridPosition?.chartMode;

                        if (chartMode === undefined) {
                            return (
                                <div key={index} className="h-full relative">
                                    <EmptyChart
                                        handleSetConfiguringPosition={() =>
                                            setConfiguringPosition(index)
                                        }
                                    />
                                </div>
                            );
                        }

                        const ChartComponent = modes[chartMode].component;

                        return (
                            <div key={index} className="h-full relative">
                                <ChartComponent index={index} />
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
