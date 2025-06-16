import { Plus, X } from "lucide-react";
import { ChartMode } from "@/types/workspace";
import { useCharts } from "@/stores/useCharts";
import { Button } from "@/components/ui/button";

import { SelectionMenu } from "./SelectionMenu";



const ChartContainer = ({
    children,
    onRemove,
    showRemove = false,
}: {
    children: React.ReactNode;
    onRemove: () => void;
    showRemove?: boolean;
}) => (
    <div className="h-full min-h-[300px] relative group">
        {showRemove && (
            <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                onClick={onRemove}
            >
                <X className="h-3 w-3" />
            </Button>
        )}
        {children}
    </div>
);

export function ChartSelector({ modes }: { modes: ChartMode[] }) {
    const {
        layout,
        gridPositions,
        setChartMode,
        configuringPosition,
        setConfiguringPosition,
        removeChart,
    } = useCharts();

    const getGridStyle = () => {
        const columns = layout.startsWith("1x") ? 1 : 2;
        return {
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: "1rem",
        };
    };

    const handleAddChart = (modeIndex: number) => {
        if (configuringPosition === null) return;

        setChartMode(configuringPosition, modeIndex);
        setConfiguringPosition(null);
    };

    const handleRemoveChart = (index: number) => {
        removeChart(index);
    };

    return (
        <div className="flex-1 flex h-full flex-col overflow-hidden custom-scrollbar bg-muted relative">
            {/* Padded container for charts only */}
            <div className="flex-1 overflow-auto p-4">
                {gridPositions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground border border-dashed rounded-lg">
                        <p className="text-sm">No charts added yet.</p>
                        <p className="text-xs mt-1">Click the chart button in a completion card to add one.</p>
                    </div>
                ) : (
                    <div style={getGridStyle()}>
                        {gridPositions.map((gridPosition, index) => {
                            const chartMode = gridPosition?.chartMode;

                            // Only render charts that have been configured
                            if (chartMode === undefined) {
                                return null;
                            }

                            const ChartComponent = modes[chartMode].component;

                            return (
                                <ChartContainer
                                    key={index}
                                    onRemove={() => handleRemoveChart(index)}
                                    showRemove={true}
                                >
                                    <ChartComponent index={index} />
                                </ChartContainer>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Inline Chart Selector Overlay */}
            {configuringPosition !== null && (
                <SelectionMenu
                    modes={modes}
                    setConfiguringPosition={setConfiguringPosition}
                    handleAddChart={handleAddChart}
                />
            )}
        </div>
    );
}
