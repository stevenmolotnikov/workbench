import config from "@/lib/config";

const defaultColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function processChartData(data) {
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

export async function fetchLogitLensData(completions) {
    const response = await fetch(
        config.getApiUrl(config.endpoints.lens),
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ completions }),
        }
    );
    
    if (!response.ok) {
        throw new Error('Failed to fetch logit lens data');
    }
    
    const rawData = await response.json();
    return processChartData(rawData);
}
