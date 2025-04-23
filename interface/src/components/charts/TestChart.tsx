"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, Legend, YAxis, ResponsiveContainer } from "recharts"
import { useMemo } from "react";
import { BorderBeam } from "@/components/magicui/border-beam";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { LogitLensResponse } from "@/components/workbench/conversation.types";

interface TestChartProps {
  title: string;
  description: string;
  data: LogitLensResponse | null;
  isLoading: boolean;
}

// Helper to assign colors dynamically
const defaultColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function TestChart({title, description, data, isLoading}: TestChartProps) {

  const { chartData, chartConfig } = useMemo(() => {
    if (!data || !data.model_results || data.model_results.length === 0) {
      return { chartData: [], chartConfig: {} };
    }

    const transformedData: Record<number, Record<string, number | string | null>> = {};
    const dynamicConfig: ChartConfig = {};
    let maxLayer = 0;
    let colorIndex = 0; // To cycle through colors for unique lines

    data.model_results.forEach((modelResult) => {
      const modelName = modelResult.model_name;

      modelResult.layer_results.forEach(layerResult => {
        const layerIdx = layerResult.layer_idx;
        maxLayer = Math.max(maxLayer, layerIdx);

        if (!transformedData[layerIdx]) {
          transformedData[layerIdx] = { layer: layerIdx };
        }

        // Iterate through probabilities for each selected token index
        layerResult.pred_probs.forEach((prob, tokenIndex) => {
          // Create a unique key for the model and token index combination
          const lineKey = `${modelName}_idx${tokenIndex}`;
          // Create a label for the legend/tooltip
          // TODO: Ideally, get the actual token string instead of just the index later
          const lineLabel = `${modelName} (Token ${tokenIndex})`;

          // Add config entry if this lineKey is new
          if (!dynamicConfig[lineKey]) {
            dynamicConfig[lineKey] = {
              label: lineLabel,
              color: defaultColors[colorIndex % defaultColors.length],
            };
            colorIndex++; // Use the next color
          }

          // Store the probability for this layer under the unique line key
          transformedData[layerIdx][lineKey] = prob;
        });
      });
    });

    // Convert the transformedData map to an array sorted by layer
    const intermediateChartData = Object.values(transformedData).sort((a, b) => (a.layer as number) - (b.layer as number));

    // Ensure all line keys exist in each layer's data point, filling with null if missing
    const allLineKeys = Object.keys(dynamicConfig);
    const finalChartData = intermediateChartData.map(layerData => {
        const completeLayerData = { ...layerData };
        allLineKeys.forEach(lineKey => {
            // Check if the key exists for this specific layer object
            if (!(lineKey in completeLayerData)) {
                completeLayerData[lineKey] = null; // Add null for missing data points
            }
        });
        return completeLayerData;
    });

    return { chartData: finalChartData, chartConfig: dynamicConfig };

  }, [data]);


  if (isLoading) {
      return (
          <Card className="relative h-full flex flex-col">
              <CardHeader>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex items-center justify-center">
                  <div className="text-center">
                      <p className="text-muted-foreground">Running analysis...</p>
                  </div>
              </CardContent>
              <BorderBeam
                  duration={5}
                  size={300}
                  className="from-transparent bg-primary to-transparent"
              />
          </Card>
      );
  }

  if (!data || chartData.length === 0) {
      return (
          <Card className="h-full flex flex-col">
              <CardHeader>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex items-center justify-center">
                  <div className="text-center">
                      <p className="text-muted-foreground">No data to display.</p>
                  </div>
              </CardContent>
          </Card>
      );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 10,
              bottom: 10,
            }}
          >
            <CartesianGrid vertical={false} />
            <Legend />
            <YAxis
              dataKey="value" // Default key, actual values come from Lines
              domain={[0, 1]} // Probabilities are between 0 and 1
              label={{ value: 'Probability', angle: -90, position: 'insideLeft' }}
              tickLine={false}
              axisLine={false}
            />
            <XAxis
              dataKey="layer"
              type="number" // Layers are numerical
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              // tickFormatter={(value) => `Layer ${value}`} // Optional: Format ticks
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            {Object.keys(chartConfig).map((modelName) => (
              <Line
                key={modelName}
                dataKey={modelName}
                type="linear"
                stroke={chartConfig[modelName]?.color || defaultColors[0]} // Use assigned color
                strokeWidth={2}
                dot={false}
                connectNulls={true} // Connect lines even if there are missing data points
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
      {/* <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Showing total visitors for the last 6 months
            </div>
          </div>
        </div>
      </CardFooter> */}
    </Card>
  )
}
