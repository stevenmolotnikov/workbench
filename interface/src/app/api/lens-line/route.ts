import config from "@/lib/config";
import { LensLineResponse } from "@/types/lens";
import { NextResponse, NextRequest } from 'next/server';
import { LineGraphData } from "@/types/charts";

const defaultColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
];

function processChartData(data: LensLineResponse) {
    if (!data?.data?.length) return { chartData: [], chartConfig: {}, maxLayer: 0 };

    const transformedData = {};
    const dynamicConfig = {};
    const maxLayer = data.metadata.maxLayer;

    // Make color config and transform data
    let colorIndex = 0;
    data.data.forEach((layerResult) => {
        const layerValue = layerResult.layer;
        if (!transformedData[layerValue]) {
            transformedData[layerValue] = { layer: layerValue };
        }
        layerResult.points.forEach((point) => {
            const lineKey = point.id;
            if (!dynamicConfig[lineKey]) {
                dynamicConfig[lineKey] = {
                    label: lineKey,
                    color: defaultColors[colorIndex % defaultColors.length],
                };
                colorIndex++;
            }
            transformedData[layerValue][lineKey] = point.prob;
        });
    });

    const sortedData = Object.values(transformedData).sort((a, b) => a.layer - b.layer);

    return { chartData: sortedData, chartConfig: dynamicConfig, maxLayer };
}

export async function POST(request: NextRequest) {
    const { completions } = await request.json();
    
    try {
        const response = await fetch(config.getApiUrl(config.endpoints.targetedLens), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ completions }),
        });

        const rawData: LensLineResponse = await response.json();
        const processedData: LineGraphData = processChartData(rawData);

        return NextResponse.json(processedData, { status: 200 } );
    } catch (error) {
        console.error("Error fetching logit lens data:", error);
        return NextResponse.json(
            { error: "Failed to fetch logit lens data" },
            { status: 500 }
        );
    }
}