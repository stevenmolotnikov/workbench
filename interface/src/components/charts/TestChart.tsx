"use client"

import { Line, LineChart, XAxis, Legend, YAxis, CartesianGrid, ReferenceDot, Tooltip, TooltipProps } from "recharts"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BorderBeam } from "@/components/magicui/border-beam";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart"
import { LogitLensResponse } from "@/types/lens";
import { Annotation } from "@/types/workspace";

// Proposed schema from backend
interface ChartDataSchema {
  data: ChartDataPoint[];
  config: ChartConfig;
  metadata: {
    maxLayer: number;
  };
}

interface ChartDataPoint {
  layer: number;
  [key: string]: number | string | Annotation[] | undefined;
  annotations?: Annotation[];
}

interface TestChartProps {
  title: string;
  description: string;
  data: LogitLensResponse | null;
  chartDataSchema?: ChartDataSchema; // New prop for optimized data flow
  isLoading: boolean;
  annotations: Annotation[];
  setActiveAnnotation: (annotation: {x: number, y: number} | null) => void;
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

const defaultColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// Extracted as a separate memoized component to prevent re-renders
const CustomTooltip = memo(({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  
  const dataPoint = payload[0].payload;
  const pointAnnotations = dataPoint?.annotations || [];
  
  return (
    <div className="rounded-lg border bg-background p-2 shadow-md">
      <p className="text-sm font-medium">Layer: {dataPoint.layer}</p>
      
      {payload.map((entry, index) => {
        if (entry.dataKey === 'annotations') return null;
        return (
          <p key={`value-${index}`} style={{ color: entry.color }} className="text-xs">
            {entry.name}: {entry.value?.toFixed(4)}
          </p>
        );
      })}
      
      {pointAnnotations.length > 0 && (
        <div className="mt-2 pt-2 border-t">
          <p className="text-xs font-medium">Annotations:</p>
          {pointAnnotations.map((ann: Annotation) => (
            <p key={ann.id} className="text-xs mt-1">{ann.text}</p>
          ))}
        </div>
      )}
    </div>
  );
});

CustomTooltip.displayName = "CustomTooltip";

// Loading state component, extracted to simplify the main component
const LoadingState = ({ title, description }: { title: string, description: string }) => (
  <Card className="relative h-full flex flex-col">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="flex-grow flex items-center justify-center">
      <p className="text-muted-foreground">Running analysis...</p>
    </CardContent>
    <BorderBeam
      duration={5}
      size={300}
      className="from-transparent bg-primary to-transparent"
    />
  </Card>
);

// Empty state component, extracted to simplify the main component
const EmptyState = ({ title, description }: { title: string, description: string }) => (
  <Card className="h-full flex flex-col">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="flex-grow flex items-center justify-center">
      <p className="text-muted-foreground">No data to display.</p>
    </CardContent>
  </Card>
);

export function TestChart({
  title, 
  description, 
  data, 
  chartDataSchema,
  isLoading,
  annotations,
  setActiveAnnotation,
}: TestChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  // Add state for potential annotation point (the point that will be annotated on click)
  const [potentialAnnotation, setPotentialAnnotation] = useState<{
    x: number,
    y: number,
    seriesKey: string
  } | null>(null);

  // Use chartDataSchema if provided, otherwise process data
  const { chartData, chartConfig, maxLayer } = useMemo(() => {
    // If backend sends pre-processed data, use it directly
    if (chartDataSchema) {
      return {
        chartData: chartDataSchema.data,
        chartConfig: chartDataSchema.config,
        maxLayer: chartDataSchema.metadata.maxLayer
      };
    }
    
    if (!data?.model_results?.length) return { chartData: [], chartConfig: {}, maxLayer: 0 };

    const transformedData: Record<number, Record<string, number | string | null>> = {};
    const dynamicConfig: ChartConfig = {};
    let maxLayer = 0;
    let colorIndex = 0;

    data.model_results.forEach((modelResult) => {
      const modelName = modelResult.model_name;

      modelResult.layer_results.forEach(layerResult => {
        const layerIdx = layerResult.layer_idx;
        maxLayer = Math.max(maxLayer, layerIdx);

        if (!transformedData[layerIdx]) {
          transformedData[layerIdx] = { layer: layerIdx };
        }

        layerResult.pred_probs.forEach((prob, tokenIndex) => {
          const lineKey = `${modelName}_idx${tokenIndex}`;
          const lineLabel = `${modelName} (Token ${tokenIndex})`;

          if (!dynamicConfig[lineKey]) {
            dynamicConfig[lineKey] = {
              label: lineLabel,
              color: defaultColors[colorIndex % defaultColors.length],
            };
            colorIndex++;
          }

          transformedData[layerIdx][lineKey] = prob;
        });
      });
    });

    const sortedData = Object.values(transformedData).sort((a, b) => 
      (a.layer as number) - (b.layer as number)
    );

    const allLineKeys = Object.keys(dynamicConfig);
    const finalData = sortedData.map(layerData => {
      const complete = { ...layerData };
      allLineKeys.forEach(key => {
        if (!(key in complete)) complete[key] = null;
      });
      return complete;
    });

    return { chartData: finalData, chartConfig: dynamicConfig, maxLayer };
  }, [data, chartDataSchema]);

  // Function to find the closest point on a line
  const getDataCoordinates = useCallback((e: React.MouseEvent<HTMLDivElement>, chartElement: Element) => {
    const cartesianGrid = chartElement.querySelector('.recharts-cartesian-grid');
    const cartesianGridRect = cartesianGrid ? cartesianGrid.getBoundingClientRect() : null;
    
    if (!cartesianGridRect) return null;
    
    const { top, bottom, left, right } = cartesianGridRect;
    
    // Calculate width and height of the data area
    const width = right - left;
    const height = bottom - top;
    
    // Calculate mouse position
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Calculate relative position within the data area
    const relativeX = (mouseX - left) / width;
    const relativeY = (bottom - mouseY) / height;
    
    // Find the closest layer index
    const dataX = Math.round(relativeX * (chartData.length - 1));
    
    // If we have an invalid dataX, return null
    if (dataX < 0 || dataX >= chartData.length) return null;
    
    // Get the data point at this layer
    const dataPoint = chartData[dataX];
    
    // Find the closest line (series) to the click
    let closestLine = null;
    let closestDistance = Infinity;
    let closestValue = 0;
    
    // Check each data series (except 'layer' and 'annotations')
    Object.entries(dataPoint).forEach(([key, value]) => {
      if (key === 'layer' || key === 'annotations') return;
      
      // Skip if the value is null or not a number
      if (value === null || typeof value !== 'number') return;
      
      // Calculate distance between the line's Y value and the mouse Y position
      const lineRelativeY = value; 
      const distance = Math.abs(lineRelativeY - relativeY);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestLine = key;
        closestValue = value;
      }
    });
    
    // If we found a closest line, return the data coordinates
    if (closestLine) {
      return {
        dataX,
        dataY: closestValue, // Using the actual Y value from the data point
        seriesKey: closestLine
      };
    }
    
    return null;
  }, [chartData]);

  // Handle mouse move to show potential annotation point
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current || !e.target || chartData.length === 0) return;
    
    const chartElement = e.currentTarget.querySelector('.recharts-wrapper');
    if (!chartElement) return;
    
    const coords = getDataCoordinates(e, chartElement);
    if (coords) {
      setPotentialAnnotation(coords);
    } else {
      setPotentialAnnotation(null);
    }
  }, [chartData.length, getDataCoordinates]);

  // Handle mouse leave to clear potential annotation
  const handleMouseLeave = useCallback(() => {
    setPotentialAnnotation(null);
  }, []);

  // Handle chart click to create annotation
  const handleChartClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (potentialAnnotation) {
      setActiveAnnotation({ 
        x: potentialAnnotation.dataX, 
        y: potentialAnnotation.dataY 
      });
    }
  }, [potentialAnnotation, setActiveAnnotation]);

  // Combined chart data with annotations
  const combinedChartData = useMemo(() => {
    if (!chartData.length) return [];
    
    const combinedData = JSON.parse(JSON.stringify(chartData));
    
    annotations.forEach(annotation => {
      const layerIndex = annotation.x;
      if (layerIndex >= 0 && layerIndex < combinedData.length) {
        if (!combinedData[layerIndex].annotations) {
          combinedData[layerIndex].annotations = [];
        }
        combinedData[layerIndex].annotations.push({
          id: annotation.id,
          y: annotation.y,
          text: annotation.text
        });
      }
    });
    
    return combinedData;
  }, [chartData, annotations]);

  // Clean up effect
  useEffect(() => {
    return () => {
      setPotentialAnnotation(null);
    };
  }, []);

  if (isLoading) {
    return <LoadingState title={title} description={description} />;
  }

  if (!data || chartData.length === 0) {
    return <EmptyState title={title} description={description} />;
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
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <ChartContainer config={chartConfig} className="w-full h-full">
            <LineChart
              data={combinedChartData}
              margin={{ left: 12, right: 12, top: 10, bottom: 10 }}
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
                domain={[0, maxLayer]}
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
              
              {/* Show potential annotation point */}
              {potentialAnnotation && (
                <ReferenceDot
                  x={chartData[potentialAnnotation.dataX]?.layer}
                  y={potentialAnnotation.dataY}
                  r={4}
                  fill="hsl(var(--primary))"
                  stroke="white"
                  strokeWidth={1}
                  isFront={true}
                />
              )}
              
              {/* Show existing annotations */}
              {annotations.map((annotation) => {
                const layerValue = chartData[annotation.x]?.layer;
                if (layerValue === undefined || layerValue === null) return null;
                
                return (
                  <ReferenceDot
                    key={annotation.id}
                    x={layerValue}
                    y={annotation.y}
                    r={4}
                    fill="hsl(var(--primary))"
                    stroke="white"
                    strokeWidth={1}
                    isFront={true}
                  />
                );
              })}
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}