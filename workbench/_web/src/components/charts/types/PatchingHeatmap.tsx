import { Heatmap } from "@/components/charts/base/Heatmap";
import { ChartCard } from "../ChartCard";

import {HeatmapProps} from "@/components/charts/base/Heatmap";

export function PatchingHeatmap({ isLoading, data }: { isLoading: boolean, data: HeatmapProps }) {
    return (
        <div className="h-full w-full">
            <ChartCard
                handleRunChart={() => {
                    console.log("run patching heatmap");
                }}
                handleRemoveChart={() => {console.log("remove chart")}}
                isLoading={isLoading}
                chartTitle={
                    <div>
                        <div className="text-md font-bold">Patching Heatmap</div>
                        {/* <span className="text-xs text-muted-foreground">
                            Completion {completionIndex}
                        </span> */}
                    </div>
                }
                chart={
                    data ? (
                        <Heatmap {...data} />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">No data</p>
                        </div>
                    )
                }
            />
        </div>
    );
}
