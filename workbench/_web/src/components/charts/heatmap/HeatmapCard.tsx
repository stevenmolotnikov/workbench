import React from "react";
import { Heatmap } from "./Heatmap";
import { HeatmapData } from "@/types/charts";
import { HeatmapProvider, useHeatmap } from "./HeatmapProvider";
import { HeatmapControls } from "./HeatmapControls";
import { useZoom, ZoomProvider } from "./ZoomProvider";
import { CanvasProvider } from "./CanvasProvider";

interface HeatmapCardProps {
    data: HeatmapData
}


export const HeatmapCard = ({ data }: HeatmapCardProps) => {
    return (
        <HeatmapProvider data={data}>
            <ZoomProvider>
                <HeatmapCardContent />
            </ZoomProvider>
        </HeatmapProvider>
    );  
};

function HeatmapCardContent() {
    const { filteredData } = useHeatmap();

    return (
        <div className="flex flex-col h-full m-2 border rounded bg-muted">
            <HeatmapControls />
            <div className="flex h-[90%] w-full">
                <CanvasProvider>
                    <Heatmap
                        data={filteredData}
                    />
                </CanvasProvider>
            </div>
        </div>
    );
}

