import React from "react";
import { Heatmap } from "./Heatmap";
import { HeatmapData } from "@/types/charts";
import { HeatmapControlsProvider } from "./HeatmapControlsProvider";
import { CanvasProvider } from "./CanvasProvider";

interface HeatmapCardProps {
    data: HeatmapData
}

export const HeatmapCard = ({ data }: HeatmapCardProps) => {
    return (
        <div className="flex flex-col h-full m-2 border rounded bg-muted">
            <HeatmapControlsProvider data={data}>
                <div className="flex h-[90%] w-full">
                    <CanvasProvider>
                        <Heatmap />
                    </CanvasProvider>
                </div>
            </HeatmapControlsProvider>
        </div>
    );
};
