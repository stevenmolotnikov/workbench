import { Heatmap } from "./Heatmap";
import { HeatmapDataProvider, useHeatmapData } from "./HeatmapDataProvider";
import { HeatmapChart } from "@/db/schema";
import { HeatmapCanvasProvider, useHeatmapCanvas } from "./HeatmapCanvasProvider";
import { HeatmapHoverProvider, useHeatmapHover } from "./HeatmapHoverProvider";
import { useAnnotationSelection } from "./useAnnotationSelection";
import { ViewProvider } from "../ViewProvider";

interface StaticHeatmapCardProps {
    chart: HeatmapChart;
}

export const StaticHeatmapCard = ({ chart }: StaticHeatmapCardProps) => {
    return (
        <div className="h-[60vh] rounded bg-muted">
            <ViewProvider chartId={chart.id}>
                <HeatmapDataProvider chart={chart}>
                    <HeatmapCanvasProvider>
                        <HeatmapHoverProvider>
                            <StaticHeatmap />
                        </HeatmapHoverProvider>
                    </HeatmapCanvasProvider>
                </HeatmapDataProvider>
            </ViewProvider>
        </div>
    );
};

const StaticHeatmap = () => {
    const { filteredData: data } = useHeatmapData()
    const { heatmapCanvasRef } = useHeatmapCanvas()
    const { handleMouseMove, handleMouseLeave } = useHeatmapHover()
    useAnnotationSelection()

    return (
        <Heatmap
            rows={data}
            heatmapCanvasRef={heatmapCanvasRef}
            useTooltip={true}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        />
    )
}