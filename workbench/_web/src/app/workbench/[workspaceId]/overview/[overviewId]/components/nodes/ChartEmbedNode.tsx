"use client";

import { DecoratorNode, LexicalEditor, NodeKey, SerializedLexicalNode, Spread } from "lexical";
import * as React from "react";
import { LineGraphData, HeatmapData } from "@/types/charts";
import { BasicChart, getChartById } from "@/lib/queries/chartQueries";
import { useQuery } from "@tanstack/react-query";
import { StaticLine } from "@/components/charts/line/StaticLine";
import { StaticHeatmap } from "@/components/charts/heatmap/StaticHeatmap";
import { Card } from "@/components/ui/card";

// Command payload and command export
import { createCommand } from "lexical";
export const INSERT_CHART_EMBED_COMMAND = createCommand<{ chart: BasicChart }>("INSERT_CHART_EMBED_COMMAND");

// Node payload
export type ChartEmbedPayload = {
  chartId: string;
  chartType: "line" | "heatmap" | null;
};

export type SerializedChartEmbedNode = Spread<{ type: "chart-embed"; version: 1; chartId: string; chartType: "line" | "heatmap" | null }, SerializedLexicalNode>;

export class ChartEmbedNode extends DecoratorNode<JSX.Element> {
  __chartId: string;
  __chartType: "line" | "heatmap" | null;

  static getType(): string {
    return "chart-embed";
  }

  static clone(node: ChartEmbedNode): ChartEmbedNode {
    return new ChartEmbedNode(node.__chartId, node.__chartType, node.__key);
  }

  constructor(chartId: string, chartType: "line" | "heatmap" | null, key?: NodeKey) {
    super(key);
    this.__chartId = chartId;
    this.__chartType = chartType;
  }

  static importJSON(serializedNode: SerializedChartEmbedNode): ChartEmbedNode {
    const node = new ChartEmbedNode(serializedNode.chartId, serializedNode.chartType);
    return node;
  }

  exportJSON(): SerializedChartEmbedNode {
    return {
      type: "chart-embed",
      version: 1,
      chartId: this.__chartId,
      chartType: this.__chartType,
    };
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.className = "my-3";
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(editor: LexicalEditor, config: any): JSX.Element {
    return <ChartEmbedComponent chartId={this.__chartId} chartType={this.__chartType} />;
  }
}

export function $createChartEmbedNode(payload: ChartEmbedPayload): ChartEmbedNode {
  return new ChartEmbedNode(payload.chartId, payload.chartType);
}

// React renderer that fetches chart and renders a static version
function ChartEmbedComponent({ chartId, chartType }: { chartId: string; chartType: "line" | "heatmap" | null }) {
  const { data: chart } = useQuery({ queryKey: ["chartById", chartId], queryFn: () => getChartById(chartId) });

  if (!chart) {
    return (
      <Card className="p-3 text-sm text-muted-foreground">Loading chart…</Card>
    );
  }

  const name = chart.name ?? "Untitled";
  const type = chart.type ?? chartType;

  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground mb-2">{name}</div>
      {type === "line" && chart.data ? (
        <StaticLine data={chart.data as LineGraphData} />
      ) : type === "heatmap" && chart.data ? (
        <StaticHeatmap data={chart.data as HeatmapData} />
      ) : (
        <div className="text-sm text-muted-foreground">No data available</div>
      )}
    </Card>
  );
}
