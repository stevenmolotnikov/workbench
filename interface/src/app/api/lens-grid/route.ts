import config from "@/lib/config";
import { LensGridResponse } from "@/types/lens";
import { HeatmapData } from "@/types/charts";
import { NextResponse, NextRequest } from 'next/server';

function processHeatmapData(data: LensGridResponse) {
    const { layer, probs, pred_strs } = data;

    const yTickLabels = Array.from({ length: pred_strs.length }, (_, i) => i);

    return {
        data: probs,
        labels: pred_strs,
        yTickLabels: yTickLabels,
        yAxisLabel: "Layers",
        xAxisLabel: "Original Tokens",
        xTickLabels: pred_strs[pred_strs.length - 1] // TODO: Add x tick labels
    };
}

export async function POST(request: NextRequest) {
    const { completion } = await request.json();

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
            body: JSON.stringify({ completion }),
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
