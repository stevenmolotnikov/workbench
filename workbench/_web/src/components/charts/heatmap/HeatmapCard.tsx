import React from "react";
import { Heatmap } from "./Heatmap";
import { HeatmapData } from "@/types/charts";
import { HeatmapProvider, useHeatmap } from "./HeatmapProvider";
import { HeatmapControls } from "./HeatmapControls";

interface HeatmapCardProps {
    data: HeatmapData
}


export const HeatmapCard = ({ data }: HeatmapCardProps) => {
    return (
        <HeatmapProvider data={data}>
            <HeatmapCardContent />
        </HeatmapProvider>
    );
};

function HeatmapCardContent() {
    const { filteredData, isZoomSelecting } = useHeatmap();

    return (
        <div className="flex flex-col h-full m-2 border rounded bg-muted">
            <HeatmapControls />
            <div className="flex h-[90%] w-full">
                <Heatmap
                    data={filteredData}
                    selectionMode={isZoomSelecting ? 'zoom' : 'annotation'}
                    selectionEnabled={true}
                />
            </div>
        </div>
    );
}

