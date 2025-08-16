import { type RefObject, useMemo } from "react";
import { Line } from "./Line";
import { LineDataProvider, useLineData } from "./LineDataProvider";
import { LineChart } from "@/db/schema";
import { LineViewProvider, useLineView } from "./LineViewProvider";
import ChartTitle from "../ChartTitle";
import { Button } from "@/components/ui/button";
import { Crop, RotateCcw } from "lucide-react";
import { LineInteractionProvider, useLineInteraction } from "@/components/charts/line/LineInteractionProvider";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { lineColors } from "../theming";
import { cn } from "@/lib/utils";

interface LineCardProps {
    chart: LineChart;
    captureRef?: RefObject<HTMLDivElement>;
}

export const LineCard = ({ chart, captureRef }: LineCardProps) => {
    return (
        <div className="flex flex-col h-full m-2 border rounded bg-muted">
            <LineDataProvider chart={chart}>
                <LineViewProvider>
                    <LineInteractionProvider>
                        <LineCardWithSelection chart={chart} />
                    </LineInteractionProvider>
                </LineViewProvider>
            </LineDataProvider>
        </div>
    )
}

const LineCardWithSelection = ({ chart }: { chart: LineChart }) => {
    const { bounds, setXRange, setYRange, data, yRange } = useLineData();
    const { activeSelection, zoomIntoActiveSelection, clearSelection, handleMouseDown, handleClick, handleMouseMove, handleMouseLeave, hoverSnappedXValue, hoverSnappedXPx, hoverYData } = useLineInteraction();
    const { selectionCanvasRef, crosshairCanvasRef } = useLineView();
    const { highlightedLineIds, toggleLineHighlight, clearHighlightedLineIds } = useLensWorkspace();

    const nearestLineIdAtX = useMemo(() => {
        if (hoverSnappedXValue == null) return null;
        const yTarget = hoverYData ?? (yRange[0] + yRange[1]) / 2;
        let bestId: string | null = null;
        let bestDist = Number.POSITIVE_INFINITY;
        for (const line of data.lines) {
            const p = line.data.find(pt => pt.x === hoverSnappedXValue);
            if (!p) continue;
            const dy = Math.abs(p.y - yTarget);
            if (dy < bestDist) {
                bestDist = dy;
                bestId = String(line.id);
            }
        }
        return bestId;
    }, [hoverSnappedXValue, hoverYData, data.lines, yRange]);

    const handleReset = async () => {
        await clearSelection();
        setXRange([bounds.xMin, bounds.xMax]);
        setYRange([0, 1]);
        clearHighlightedLineIds();
    };

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex h-[10%] gap-2 items-center p-4 lg:p-8 justify-between">
                <ChartTitle chart={chart} />
                <div className="flex items-center gap-2">
                    <Button
                        variant={activeSelection ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8"
                        onClick={() => { void zoomIntoActiveSelection() }}
                        disabled={!activeSelection}
                        title={activeSelection ? "Zoom into selection and clear selection" : "Draw a selection on the chart first"}
                    >
                        <Crop className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8" onClick={() => { void handleReset() }} title="Reset zoom and clear selection">
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            <div className="flex h-[90%] w-full">
                <div
                    className="size-full relative cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleClick}
                >
                    <canvas
                        ref={crosshairCanvasRef}
                        className="absolute inset-0 top-[5%] h-[95%] w-full z-10 pointer-events-none"
                    />
                    <canvas
                        ref={selectionCanvasRef}
                        className="absolute inset-0 top-[5%] h-[95%]  w-full z-20 cursor-crosshair"
                    />
                    {hoverSnappedXValue != null && hoverSnappedXPx != null && (
                        <TooltipAtX xValue={hoverSnappedXValue} xPx={hoverSnappedXPx} nearestLineId={nearestLineIdAtX} />
                    )}
                    <Line
                        data={data}
                        yRange={yRange}
                        onLegendClick={toggleLineHighlight}
                        highlightedLineIds={highlightedLineIds}
                    />
                </div>
            </div>

        </div>
    );
}

function TooltipAtX({ xValue, xPx, nearestLineId }: { xValue: number, xPx: number, nearestLineId?: string | null }) {
    const { data } = useLineData();
    // Position near the top, horizontally at snapped X in pixels
    return (
        <div
            className="absolute top-[5%] z-30 pointer-events-none"
            style={{ left: Math.max(0, xPx - 80) }}
        >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs rounded px-2 py-1 shadow-sm whitespace-nowrap">
                <div className="font-medium mb-1">x = {String(xValue)}</div>
                {data.lines.map((line, index) => {
                    const p = line.data.find(pt => pt.x === xValue);
                    if (!p) return null;
                    const isNearest = nearestLineId && String(line.id) === nearestLineId;
                    const color = lineColors[index % lineColors.length];
                    return (
                        <div key={String(line.id)} className="flex items-center gap-2">
                            <span className={cn(
                                "w-3 h-1 rounded-full",
                                isNearest ? "opacity-100" : "opacity-25"
                            )} style={{ backgroundColor : color }} />
                            <span className={isNearest ? "font-bold" : undefined}>
                                {line.id}: {p.y.toFixed(3)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}