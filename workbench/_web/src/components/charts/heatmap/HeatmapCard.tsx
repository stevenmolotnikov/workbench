import { type RefObject } from "react";
import { Heatmap } from "./Heatmap";
import { HeatmapDataProvider, useHeatmapData } from "./HeatmapDataProvider";
import { HeatmapChart } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Crop, RotateCcw } from "lucide-react";
import { HeatmapCanvasProvider, useHeatmapCanvasProvider } from "./HeatmapCanvasProvider";
import { HeatmapHoverProvider, useHeatmapHover } from "./HeatmapHoverProvider";
import { Tooltip } from "./Tooltip";
import { useSelection } from "./useSelection";

interface HeatmapCardProps {
    chart: HeatmapChart;
    pending: boolean;
    captureRef?: RefObject<HTMLDivElement>;
}

export const HeatmapCard = ({ chart, captureRef, pending }: HeatmapCardProps) => {
    return (
        <div className="flex flex-col h-full m-2 border rounded bg-muted">
            {pending ? (
                <PendingHeatmap />
            ) : (
                <HeatmapDataProvider chart={chart}>
                    <HeatmapCanvasProvider>
                        <HeatmapHoverProvider>
                            <HeatmapCardContent captureRef={captureRef} />
                        </HeatmapHoverProvider>
                    </HeatmapCanvasProvider>
                </HeatmapDataProvider>
            )}
        </div>
    );
};

const PendingHeatmap = () => {
    return (
        <div className="flex flex-col size-full relative">
            <div className="flex h-[10%] gap-2 items-center p-4 lg:p-8 justify-end">
                <input
                    disabled
                    className="w-20 h-8 border rounded px-2 text-xs bg-background"
                />
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8"
                    disabled
                >
                    <Crop className="w-4 h-4" />
                </Button>

                <Button variant="outline" size="sm" className="h-8 w-8" disabled>
                    <RotateCcw className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex h-[90%] w-full">
                <Heatmap rows={[]} />
            </div>

            <div className="absolute inset-0 z-30 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 w-full h-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>
        </div>
    )
}

interface HeatmapCardContentProps {
    captureRef?: RefObject<HTMLDivElement>;
}

const HeatmapCardContent = ({ captureRef }: HeatmapCardContentProps) => {
    const { filteredData: data, bounds, xStep, handleStepChange, setXRange, setYRange, setXStep, defaultXStep } = useHeatmapData()
    const { zoomIntoActiveSelection, clearSelection, activeSelection, onMouseDown } = useSelection()
    const { heatmapCanvasRef } = useHeatmapCanvasProvider()
    const { handleMouseMove, handleMouseLeave } = useHeatmapHover()

    // Handle reset: clear selection and reset ranges/step
    const handleReset = async () => {
        await clearSelection()
        setXRange([bounds.minCol, bounds.maxCol]);
        const start = Math.max(bounds.minRow, bounds.maxRow - 9);
        setYRange([start, bounds.maxRow]);
        setXStep(defaultXStep);
    }

    return (
        <div className="flex flex-col size-full">
            <div className="flex h-[10%] gap-2 items-center p-4 lg:p-8 justify-end">
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

            <div className="flex h-[90%] w-full" ref={captureRef}>
                {/* <div className="size-full relative cursor-crosshair" onMouseDown={onMouseDown} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                    <canvas
                        ref={heatmapCanvasRef}
                        className="absolute inset-0 size-full pointer-events-auto z-20"
                    />
                    <Heatmap rows={data} />
                    <Tooltip />
                </div> */}
                <Heatmap
                    rows={data}
                    heatmapCanvasRef={heatmapCanvasRef}
                    useTooltip={true}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onMouseDown={onMouseDown} 
                    />
            </div>
        </div>
    )
}