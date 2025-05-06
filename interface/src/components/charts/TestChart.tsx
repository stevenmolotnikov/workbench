"use client"

import { Line, LineChart, XAxis, Legend, YAxis, CartesianGrid, ReferenceDot, Tooltip, TooltipProps } from "recharts"
import { useMemo, useRef } from "react";
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

interface TestChartProps {
  title: string;
  description: string;
  data: LogitLensResponse | null;
  isLoading: boolean;
  annotations: Annotation[];
  setActiveAnnotation: (annotation: {x: number, y: number} | null) => void;
}

const defaultColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

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
  setActiveAnnotation,
}: TestChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const { chartData, chartConfig, maxLayer } = useMemo(() => {
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
  }, [data]);

  const handleChartClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current || !e.target || chartData.length === 0) return;
    
    const chartRect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - chartRect.left;
    const y = e.clientY - chartRect.top;
    
    const xPercent = x / chartRect.width;
    const yPercent = 1 - (y / chartRect.height);
    
    const xRange = chartData.length - 1;
    const dataX = Math.round(xPercent * xRange);
    
    setActiveAnnotation({ x: dataX, y: yPercent });
  };

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

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
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
          <p className="text-muted-foreground">Running analysis...</p>
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
          <p className="text-muted-foreground">No data to display.</p>
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
              
              {annotations.map((annotation) => {
                const layerValue = chartData[annotation.x]?.layer;
                if (layerValue === undefined || layerValue === null) return null;
                
                return (
                  <ReferenceDot
                    key={annotation.id}
                    x={layerValue}
                    y={annotation.y}
                    r={4}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    shape={(props) => {
                      const { cx, cy, r } = props;
                      const size = r * 0.7;
                      return (
                        <g>
                          <line x1={cx - size} y1={cy - size} x2={cx + size} y2={cy + size} stroke="hsl(var(--primary))" strokeWidth={2} />
                          <line x1={cx - size} y1={cy + size} x2={cx + size} y2={cy - size} stroke="hsl(var(--primary))" strokeWidth={2} />
                        </g>
                      );
                    }}
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
