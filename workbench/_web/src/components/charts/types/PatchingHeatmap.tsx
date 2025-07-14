import { Heatmap } from "@/components/charts/primatives/Heatmap";
import { ChartCard } from "../ChartCard";

import type {HeatmapProps} from "@/components/charts/primatives/Heatmap";

export function PatchingHeatmap({ isLoading, data }: { isLoading: boolean, data: HeatmapProps | null }) {
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
                        <span className="text-xs text-muted-foreground">Activation Patching Results</span>
                    </div>
                }
                chart={
                    data ? (
                        <div className="pt-6 h-full">
                            <Heatmap {...data} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">No data</p>
                        </div>
                    )
                }
                showRunButton={false}
                showRemoveButton={false}
            />
        </div>
    );
}
