"use client";

import { DecoratorNode, LexicalEditor, NodeKey, SerializedLexicalNode, Spread } from "lexical";
import * as React from "react";
import { LineGraphData, HeatmapData } from "@/types/charts";
import { getChartById } from "@/lib/queries/chartQueries";
import type { BasicChart } from "@/types/charts";
import { useQuery } from "@tanstack/react-query";
import { StaticLine } from "@/components/charts/line/StaticLine";
import { StaticHeatmap } from "@/components/charts/heatmap/StaticHeatmap";
import { Card } from "@/components/ui/card";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
// no-op

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

  decorate(editor: LexicalEditor, config: unknown): JSX.Element {
    return <ChartEmbedComponent nodeKey={this.getKey()} chartId={this.__chartId} chartType={this.__chartType} />;
  }
}

export function $createChartEmbedNode(payload: ChartEmbedPayload): ChartEmbedNode {
  return new ChartEmbedNode(payload.chartId, payload.chartType);
}

// React renderer that fetches chart and renders a static version
function ChartEmbedComponent({ nodeKey, chartId, chartType }: { nodeKey: NodeKey; chartId: string; chartType: "line" | "heatmap" | null }) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey);
  const { data: chart } = useQuery({ queryKey: ["chartById", chartId], queryFn: () => getChartById(chartId) });

  const name = (chart?.name ?? "Untitled");
  const type = (chart?.type ?? chartType);

  return (
    <Card
      className={`p-3 cursor-pointer ${isSelected ? "border-primary ring-1 ring-primary" : ""}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelected(true);
        editor.focus();
      }}
      tabIndex={0}
    >
      <div className="text-xs text-muted-foreground mb-2">{name}</div>
      {!chart ? (
        <div className="text-sm text-muted-foreground">Loading chart…</div>
      ) : type === "line" && chart.data ? (
        <StaticLine data={chart.data as LineGraphData} />
      ) : type === "heatmap" && chart.data ? (
        <StaticHeatmap data={chart.data as HeatmapData} />
      ) : (
        <div className="text-sm text-muted-foreground">No data available</div>
      )}
    </Card>
  );
}
