import React from "react";
import { Line } from "./Line";
import { LineDataProvider, useLineData } from "./LineDataProvider";
import { LineChart } from "@/db/schema";
import { LineCanvasProvider, useLineCanvas } from "./LineCanvasProvider";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { useCrosshair } from "./useCrosshair";
import { LineHoverProvider, useLineHover } from "./LineHoverProvider";
import { useAnnotationSelection } from "./useAnnotationSelection";
import { ViewProvider } from "../ViewProvider";


interface StaticLineCardProps {
    chart: LineChart;
}

export const StaticLineCard = ({ chart }: StaticLineCardProps) => {
    return (
        <div className="h-[60vh] rounded bg-muted">
            <ViewProvider chartId={chart.id}>
                <LineDataProvider chart={chart}>
                    <LineCanvasProvider>
                        <LineHoverProvider>
                            <StaticLine />
                        </LineHoverProvider>
                    </LineCanvasProvider>
                </LineDataProvider>
            </ViewProvider>
        </div>
    )
}

const StaticLine = () => {
    // Provider context hooks
    const { lines, yRange } = useLineData();
    const { rafRef, lineCanvasRef } = useLineCanvas();
    const { handleMouseMove, handleMouseLeave } = useLineHover();

    // Enable legend highlighting
    const { highlightedLineIds } = useLensWorkspace();

    // Draw vertical crosshair
    const { crosshairCanvasRef } = useCrosshair({ rafRef });

    // Enable default annotation selection
    useAnnotationSelection();

    return (
        <Line
            lines={lines}
            yRange={yRange}
            highlightedLineIds={highlightedLineIds}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            lineCanvasRef={lineCanvasRef}
            crosshairCanvasRef={crosshairCanvasRef}
            useTooltip={true}
        />
    );
}