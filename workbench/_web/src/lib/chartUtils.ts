import { LineGraphData, LineData } from "@/types/charts";

const defaultColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
];

interface Point {
    name: string;
    prob: number;
}

interface Layer {
    layer: number;
    points: Point[];
}

export interface LensLineResponse {
    layerResults: Layer[];
    maxLayer: number;
}

export function processLineData(data: LensLineResponse): LineGraphData {
    if (!data?.layerResults?.length) return { chartData: [], chartConfig: {}, maxLayer: 0, lineData: {} };

    const transformedData: {
        [key: number]: { layer: number; [key: string]: number | string | null };
    } = {};
    const dynamicConfig: { [key: string]: { label: string; color: string } } = {};
    const maxLayer = data.maxLayer;
    const lineMaxLayers: LineData = {};

    // Make color config and transform data
    let colorIndex = 0;
    data.layerResults.forEach((layerResult) => {
        const layerValue = layerResult.layer;
        if (!transformedData[layerValue]) {
            transformedData[layerValue] = { layer: layerValue };
        }
        layerResult.points.forEach((point) => {
            const lineKey = point.name;
            if (!dynamicConfig[lineKey]) {
                dynamicConfig[lineKey] = {
                    label: lineKey,
                    color: defaultColors[colorIndex % defaultColors.length],
                };
                colorIndex++;
            }
            transformedData[layerValue][lineKey] = point.prob;

            // Track max layer for each line
            if (!lineMaxLayers[lineKey] || layerValue > lineMaxLayers[lineKey]) {
                lineMaxLayers[lineKey] = layerValue;
            }
        });
    });

    const sortedData = Object.values(transformedData).sort((a, b) => a.layer - b.layer);

    return {
        chartData: sortedData,
        chartConfig: dynamicConfig,
        maxLayer,
        lineData: lineMaxLayers,
    } as LineGraphData;
}

export interface LensGridResponse {
    input_strs: string[];
    probs: number[][];
    pred_strs: string[][];
}

export function processHeatmapData(data: LensGridResponse) {
    const { probs, pred_strs, input_strs } = data;

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