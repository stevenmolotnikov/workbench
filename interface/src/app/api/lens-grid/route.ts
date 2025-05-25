import config from "@/lib/config";
import { LensGridResponse } from "@/types/lens";
import { HeatmapData } from "@/types/charts";
import { NextResponse, NextRequest } from 'next/server';

function processHeatmapData(data: LensGridResponse) {
    const { layer, probs, pred_strs } = data;

    return {
        data: probs,
        labels: pred_strs,
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
