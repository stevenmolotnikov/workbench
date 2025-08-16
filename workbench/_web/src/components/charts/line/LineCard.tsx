import { type RefObject } from "react";
import { Line } from "./Line";
import { LineDataProvider, useLineData } from "./LineDataProvider";
import { LineChart } from "@/db/schema";
import { LineViewProvider } from "./LineViewProvider";
import { InteractionLayer } from "@/components/charts/line/InteractionLayer";
import { useLensWorkspace } from "@/stores/useLensWorkspace";

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

    return (
        <InteractionLayer>
            <Line
                data={data}
                yRange={yRange}
                onLegendClick={toggleLineHighlight}
                highlightedLineIds={highlightedLineIds}
            />
        </InteractionLayer>
    );
}