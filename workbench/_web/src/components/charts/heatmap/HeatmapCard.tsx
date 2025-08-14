import { type RefObject } from "react";
import { Heatmap } from "./Heatmap";
import { HeatmapDataProvider, useHeatmapData } from "./HeatmapDataProvider";
import { SelectionProvider, useSelection } from "./SelectionProvider";
import { HeatmapChart } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Crop, RotateCcw } from "lucide-react";
import ChartTitle from "@/components/charts/ChartTitle";
import { CanvasProvider, useCanvasProvider } from "./CanvasProvider";

interface HeatmapCardProps {
    chart: HeatmapChart;
    captureRef?: RefObject<HTMLDivElement>;
}

export const HeatmapCard = ({ chart, captureRef }: HeatmapCardProps) => {
    return (
        <div className="flex flex-col h-full m-2 border rounded bg-muted">
            <HeatmapDataProvider chart={chart}>
                <CanvasProvider>
                    <SelectionProvider chart={chart}>
                        <HeatmapCardContent chart={chart} captureRef={captureRef} />
                    </SelectionProvider>

                </CanvasProvider>
            </HeatmapDataProvider>
        </div>
    );
};

const HeatmapCardContent = ({ chart, captureRef }: HeatmapCardProps) => {
    const { bounds, xStep, handleStepChange, setXRange, setYRange, setXStep, defaultXStep } = useHeatmapData()
    const { zoomIntoActiveSelection, clearSelection, activeSelection } = useSelection()

    // Handle reset: clear selection and reset ranges/step
    const handleReset = async () => {
        await clearSelection()
        setXRange([bounds.minCol, bounds.maxCol]);
        const start = Math.max(bounds.minRow, bounds.maxRow - 9);
        setYRange([start, bounds.maxRow]);
        setXStep(defaultXStep);
    }

    return (
        <>
            <div className="flex h-[10%] gap-2 items-center p-4 lg:p-8 justify-between">
                <ChartTitle chart={chart} />
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min={1}
                            max={Math.max(1, bounds.maxCol - bounds.minCol)}
                            step={1}
                            value={xStep}
                            onChange={handleStepChange}
                            className="w-20 h-8 border rounded px-2 text-xs bg-background"
                            aria-label="X Range Step"
                            title="X Range Step"
                        />
                    </div>
                    <Button
                        variant={activeSelection ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8"
                        onClick={() => { void zoomIntoActiveSelection() }}
                        disabled={!activeSelection}
                        title={activeSelection ? "Zoom into selection and clear annotation" : "Draw a selection on the chart first"}
                    >
                        <Crop className="w-4 h-4" />
                    </Button>

                    <Button variant="outline" size="sm" className="h-8 w-8" onClick={() => { void handleReset() }} title="Reset zoom and clear selection">
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="flex h-[90%] w-full" ref={captureRef}>
                <HeatmapWithCanvas />
            </div>
        </>
    )
}

const HeatmapWithCanvas = () => {
    const { onMouseDown } = useSelection()
    const { selectionCanvasRef } = useCanvasProvider()

    return (
        <div className="size-full relative" onMouseDown={onMouseDown}>
            <canvas
                ref={selectionCanvasRef}
                className="absolute inset-0 size-full pointer-events-auto z-20"
            />
            <Heatmap />
        </div>
    )
}