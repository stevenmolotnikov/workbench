import { type RefObject } from "react";
import { Line } from "./Line";
import { LineControlsProvider, useLineControls } from "./LineControlsProvider";
import { LineChart } from "@/db/schema";
import { CanvasProvider, useCanvas } from "./CanvasProvider";


interface LineCardProps {
    chart: LineChart;
    captureRef?: RefObject<HTMLDivElement>;
}

export const LineCard = ({ chart, captureRef }: LineCardProps) => {
    return (
        <div className="flex flex-col h-full m-2 border rounded bg-muted">
            <LineControlsProvider chart={chart}>
                <div className="flex h-[90%] w-full" ref={captureRef}>
                    <CanvasProvider>    
                        <LineCardContent />
                    </CanvasProvider>
                </div>
            </LineControlsProvider>
        </div>
    )
}

const LineCardContent = () => {
    const { data, yRange } = useLineControls()
    const { handlePointClick } = useCanvas()
    return <Line data={data} yRange={yRange} onClick={handlePointClick} />
}
