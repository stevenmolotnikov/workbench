import { type RefObject } from "react";
import { Line } from "./Line";
import { LineDataProvider, useLineData } from "./LineDataProvider";
import { LineChart } from "@/db/schema";
import { CanvasProvider, useCanvas } from "./CanvasProvider";
import ChartTitle from "../ChartTitle";
import { Button } from "@/components/ui/button";
import { Crop, RotateCcw } from "lucide-react";
import { SelectionProvider, useSelection } from "@/components/charts/line/SelectionProvider";

interface LineCardProps {
    chart: LineChart;
    captureRef?: RefObject<HTMLDivElement>;
}

export const LineCard = ({ chart, captureRef }: LineCardProps) => {
    return (
        <div className="flex flex-col h-full m-2 border rounded bg-muted">
            <LineDataProvider chart={chart}>
                <CanvasProvider>
                    <SelectionProvider>
                        <LineCardWithSelection chart={chart} />
                    </SelectionProvider>
                </CanvasProvider>
            </LineDataProvider>
        </div>
    )
}

const LineCardWithSelection = ({ chart }: { chart: LineChart }) => {
    const { bounds, setXRange, setYRange, data, yRange } = useLineData();
    const { activeSelection, zoomIntoActiveSelection, clearSelection } = useSelection();
    const { selectionCanvasRef } = useCanvas();

    const handleReset = async () => {
        await clearSelection();
        setXRange([bounds.xMin, bounds.xMax]);
        setYRange([0, 1]);
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
            <div className="size-full relative">
            <canvas
                ref={selectionCanvasRef}
                className="absolute inset-0 top-[5%] h-[95%]  w-full z-20 cursor-crosshair"
            />
            <Line
                data={data}
                yRange={yRange}
            />
        </div>
            </div>
        </div>
    );
}