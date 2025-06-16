import { NextRequest, NextResponse } from "next/server";
import config from "@/lib/config";
import { LensGridResponse } from "@/types/lens";
import { HeatmapData } from "@/types/charts";

function processHeatmapData(data: LensGridResponse) {
    const { layer, probs, pred_strs, input_strs } = data;

    const yTickLabels = Array.from({ length: pred_strs.length }, (_, i) => i);

    return {
        data: probs,
        labels: pred_strs,
        yTickLabels: yTickLabels,
        yAxisLabel: "Layers",
        xAxisLabel: "Tokens",
        xTickLabels: input_strs
    };
}

export async function POST(request: NextRequest) {
    const { completion, job_id } = await request.json();

    if (!completion) {
        return NextResponse.json(
            { error: "No completion provided" },
            { status: 400 }
        );
    }
    
    try {
        const response = await fetch(config.getApiUrl(config.endpoints.gridLens), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ completion, job_id }),
        });

        const rawData: LensGridResponse = await response.json();
        const processedData: HeatmapData = processHeatmapData(rawData);

        return NextResponse.json(processedData, { status: 200 } );
    } catch (error) {
        console.error("Error fetching logit lens data:", error);
        return NextResponse.json(
            { error: "Failed to fetch logit lens data" },
            { status: 500 }
        );
    }
}
