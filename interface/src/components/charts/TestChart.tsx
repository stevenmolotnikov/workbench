"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, Legend, YAxis, ResponsiveContainer, Scatter, ReferenceDot, Tooltip, TooltipProps } from "recharts"
import { useMemo, useState, useRef } from "react";
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
import { LogitLensResponse } from "@/types/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TestChartProps {
  title: string;
  description: string;
  data: LogitLensResponse | null;
  isLoading: boolean;
  annotations: Annotation[];
  setAnnotations: (annotations: Annotation[]) => void;
  activeAnnotation: {x: number, y: number} | null;
  setActiveAnnotation: (annotation: {x: number, y: number} | null) => void;
  annotationText: string;
  setAnnotationText: (text: string) => void;
  addAnnotation: () => void;
  cancelAnnotation: () => void;
  deleteAnnotation: (id: string) => void;
}

// Helper to assign colors dynamically
const defaultColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface Annotation {
  id: string;
  x: number;
  y: number;
  text: string;
  timestamp: number;
}

// Add new interfaces for custom types
interface AnnotationData {
  id: string;
  y: number;
  text: string;
}

interface ChartDataPoint {
  layer: number;
  [key: string]: number | string | AnnotationData[] | undefined;
  annotations?: AnnotationData[];
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  payload?: Array<{
    dataKey: string;
    name: string;
    color: string;
    value: number;
    payload: ChartDataPoint;
  }>;
}

export function TestChart({
  title, 
  description, 
  data, 
  isLoading,
  annotations,
  setAnnotations,
  activeAnnotation,
  setActiveAnnotation,
  annotationText,
  setAnnotationText,
  addAnnotation,
  cancelAnnotation,
  deleteAnnotation
}: TestChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

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

  const handleChartClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current || !e.target) return;
    
    const chartRect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - chartRect.left;
    const y = e.clientY - chartRect.top;
    
    // Convert pixel coordinates to data coordinates
    // This is a simplification - in a real implementation, you'd need to use the chart's
    // internal conversion methods to get accurate data coordinates
    const xPercent = x / chartRect.width;
    const yPercent = 1 - (y / chartRect.height);
    
    if (chartData.length === 0) return;
    
    const xRange = chartData.length - 1;
    const dataX = Math.round(xPercent * xRange);
    const dataY = yPercent; // Assuming y is in the range [0, 1]
    
    setActiveAnnotation({ x: dataX, y: dataY });
  };

  // Create a combined dataset that includes both the chart data and annotations
  const combinedChartData = useMemo(() => {
    if (chartData.length === 0) return [];
    
    // Create a deep copy of the chart data
    const combinedData = JSON.parse(JSON.stringify(chartData));
    
    // Add annotation data points to the respective layers
    annotations.forEach(annotation => {
      const layerIndex = annotation.x;
      if (layerIndex >= 0 && layerIndex < combinedData.length) {
        // If the annotation key doesn't exist yet, initialize it
        if (!combinedData[layerIndex].annotations) {
          combinedData[layerIndex].annotations = [];
        }
        // Add this annotation to the data point
        combinedData[layerIndex].annotations.push({
          id: annotation.id,
          y: annotation.y,
          text: annotation.text
        });
      }
    });
    
    return combinedData;
  }, [chartData, annotations]);

  // Custom tooltip component for both data and annotations
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload || !payload.length) return null;
    
    // Check if this data point has annotations
    const dataPoint = payload[0]?.payload;
    const pointAnnotations = dataPoint?.annotations || [];
    
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <p className="text-sm font-medium">Layer: {dataPoint.layer}</p>
        
        {/* Show regular data values */}
        {payload.map((entry, index) => {
          if (entry.dataKey === 'annotations') return null;
          return (
            <p key={`value-${index}`} style={{ color: entry.color }} className="text-xs">
              {entry.name}: {entry.value?.toFixed(4)}
            </p>
          );
        })}
        
        {/* Show annotations if any */}
        {pointAnnotations.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs font-medium">Annotations:</p>
            {pointAnnotations.map((ann: AnnotationData) => (
              <p key={ann.id} className="text-xs mt-1">{ann.text}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

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
        <div 
          ref={chartRef} 
          className="w-full h-full relative" 
          onClick={handleChartClick}
        >
          <ChartContainer config={chartConfig} className="w-full h-full">
            <LineChart
              accessibilityLayer
              data={combinedChartData}
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
                dataKey="value"
                domain={[0, 1]}
                label={{ value: 'Probability', angle: -90, position: 'insideLeft' }}
                tickLine={false}
                axisLine={false}
              />
              <XAxis
                dataKey="layer"
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {Object.keys(chartConfig).map((modelName) => (
                <Line
                  key={modelName}
                  dataKey={modelName}
                  type="linear"
                  stroke={chartConfig[modelName]?.color || defaultColors[0]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={true}
                />
              ))}
              
              {/* Display annotation markers */}
              {annotations.map((annotation) => {
                // Only render ReferenceDot if we have valid layer data
                const layerValue = chartData[annotation.x]?.layer;
                if (layerValue === undefined || layerValue === null) return null;
                
                return (
                  <ReferenceDot
                    key={annotation.id}
                    x={layerValue}
                    y={annotation.y}
                    r={6}
                    fill="hsl(var(--primary))"
                    stroke="white"
                    strokeWidth={2}
                    isFront={true}
                  />
                );
              })}
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
