import React, { useEffect, type RefObject } from "react";
import { Line } from "./Line";
import { LineDataProvider, useLineData } from "./LineDataProvider";
import { LineChart } from "@/db/schema";
import { LineViewProvider } from "./LineViewProvider";
import { useLineView } from "./LineViewProvider";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { Button } from "@/components/ui/button";
import { Crop, RotateCcw } from "lucide-react";
import { useSelection } from "./useSelection";
import { useCrosshair } from "./useCrosshair";


interface LineCardProps {
    chart: LineChart;
    captureRef?: RefObject<HTMLDivElement>;
}

export const LineCard = ({ chart, captureRef }: LineCardProps) => {
    return (
        <div className="flex flex-col h-full m-2 border rounded bg-muted">
            <LineDataProvider chart={chart}>
                <LineViewProvider>
                    <LineCardWithSelection />
                </LineViewProvider>
            </LineDataProvider>
        </div>
    )
}

const LineCardWithSelection = () => {
    const { data, yRange } = useLineData();
    const { highlightedLineIds, toggleLineHighlight } = useLensWorkspace();
    const { rafRef, clear, activeSelection, crosshairCanvasRef, selectionCanvasRef } = useLineView();
    const { clearHighlightedLineIds } = useLensWorkspace();

    const {
        handleMouseDown,
        zoomIntoActiveSelection,
        resetZoom,
        didDragRef,
    } = useSelection({ rafRef });

    const {
        handleMouseMove,
        handleMouseLeave,
        handleClick,
    } = useCrosshair({ rafRef });

    const combinedHandleMouseLeave = () => {
        handleMouseLeave();
        if (!activeSelection) {
            clear();
        }
    };

    const combinedHandleClick = (e: React.MouseEvent) => {
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
                {/* <ChartTitle chart={chart} /> */}
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
                    <Button variant="outline" size="sm" className="h-8 w-8" onClick={() => { void handleReset() }} title="Reset zoom and clear selection">
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
                    onMouseLeave={combinedHandleMouseLeave}
                    onClick={combinedHandleClick}
                    crosshairCanvasRef={crosshairCanvasRef}
                    selectionCanvasRef={selectionCanvasRef}
                />
            </div>
        </div>
    );
}