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


interface LineCardProps {
    chart: LineChart;
    captureRef?: RefObject<HTMLDivElement>;
}

export const LineCard = ({ chart, captureRef }: LineCardProps) => {
    return (
        <div className="flex flex-col h-full m-2 border rounded bg-muted">
            <LineDataProvider chart={chart}>
                <LineCanvasProvider>
                    <LineHoverProvider>
                        <LineCardWithSelection />
                    </LineHoverProvider>
                </LineCanvasProvider>
            </LineDataProvider>
        </div>
    )
}

const LineCardWithSelection = () => {
    // Provider context hooks
    const { data, yRange } = useLineData();
    const { rafRef, lineCanvasRef } = useLineCanvas();
    const { handleMouseMove, handleMouseLeave } = useLineHover();

    // Interaction hooks
    const { highlightedLineIds, toggleLineHighlight, clearHighlightedLineIds } = useLensWorkspace();
    const { crosshairCanvasRef } = useCrosshair({ rafRef });
    const { handleClick } = useLineClick();
    const {
        handleMouseDown,
        zoomIntoActiveSelection,
        resetZoom,
        activeSelection,
        didDragRef,
    } = useSelection({ rafRef });

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
            <div className="flex h-[10%] gap-2 items-center p-4 lg:p-8 justify-between">
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
                    data={data}
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