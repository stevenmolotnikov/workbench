import React, { type RefObject } from "react";
import { Line } from "./Line";
import { LineDataProvider, useLineData } from "./LineDataProvider";
import { LineChart } from "@/db/schema";
import { LineCanvasProvider, useLineCanvas } from "./LineCanvasProvider";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { Button } from "@/components/ui/button";
import { Crop, RotateCcw } from "lucide-react";
import { useSelection } from "./useSelection";
import { useCrosshair } from "./useCrosshair";
import { useLineClick } from "./useLineClick";
import { LineHoverProvider, useLineHover } from "./LineHoverProvider";
import { useAnnotationSelection } from "./useAnnotationSelection";
import { useWorkspace } from "@/stores/useWorkspace";


interface LineCardProps {
    chart: LineChart;
    pending: boolean;
    captureRef?: RefObject<HTMLDivElement>;
}

export const LineCard = ({ chart, captureRef, pending }: LineCardProps) => {
    return (
        <div className="flex flex-col h-full m-2 border rounded bg-muted">
            {pending ? (
                <PendingLine />
            ) : (
                <LineDataProvider chart={chart}>
                    <LineCanvasProvider>
                        <LineHoverProvider>
                            <InteractiveLine />
                        </LineHoverProvider>
                    </LineCanvasProvider>
                </LineDataProvider>
            )}
        </div>
    )
}

const PendingLine = () => {
    return (
        <div className="flex flex-col h-full w-full relative">
            <div className="flex h-[10%] gap-2 items-end p-4 lg:p-8 justify-end">
                <div className="flex items-center gap-2">
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
            </div>
            <div className="flex h-[90%] w-full">
                <Line lines={[]} />
            </div>

            <div className="absolute inset-0 z-30 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 w-full h-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>
        </div>
    );
}

const InteractiveLine = () => {
    // Provider context hooks
    const { lines, yRange } = useLineData();
    const { rafRef, lineCanvasRef, activeSelection } = useLineCanvas();
    const { handleMouseMove, handleMouseLeave } = useLineHover();

    // Enable legend highlighting
    const { highlightedLineIds, toggleLineHighlight, clearHighlightedLineIds } = useLensWorkspace();

    // Draw vertical crosshair
    const { crosshairCanvasRef } = useCrosshair({ rafRef });

    // Enable line click
    const { handleClick } = useLineClick();

    // Enable drag selection
    const {
        handleMouseDown,
        zoomIntoActiveSelection,
        resetZoom,
        didDragRef,
    } = useSelection();

    // Enable default annotation selection
    useAnnotationSelection();

    const onClick = (e: React.MouseEvent) => {
        if (didDragRef.current) {
            didDragRef.current = false;
            return;
        }
        handleClick(e);
    };

    const handleReset = async () => {
        await resetZoom();
        clearHighlightedLineIds();
    };

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex h-[10%] gap-2 items-end p-4 lg:p-8 justify-end">
                <div className="flex items-center gap-2">
                    <Button
                        variant={activeSelection ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8"
                        onClick={() => { void zoomIntoActiveSelection(activeSelection) }}
                        disabled={!activeSelection}
                        title={activeSelection ? "Zoom into selection and clear selection" : "Draw a selection on the chart first"}
                    >
                        <Crop className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8" onClick={handleReset} title="Reset zoom and clear selection">
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            <div className="flex h-[90%] w-full">
                <Line
                    lines={lines}
                    yRange={yRange}
                    onLegendClick={toggleLineHighlight}
                    highlightedLineIds={highlightedLineIds}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={onClick}
                    lineCanvasRef={lineCanvasRef}
                    crosshairCanvasRef={crosshairCanvasRef}
                    useTooltip={true}
                />
            </div>
        </div>
    );
}