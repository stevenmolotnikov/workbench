"use client";

import { useMemo } from "react";
import { ResponsiveHeatMapCanvas } from "@nivo/heatmap";
import { HeatmapData } from "@/types/charts";
import { heatmapTheme, heatmapMargin } from "../theming";
import { resolveThemeCssVars } from "@/lib/utils";

export function StaticHeatmap({ data }: { data: HeatmapData }) {
  const resolvedTheme = useMemo(() => resolveThemeCssVars(heatmapTheme), []);
  return (
    <div className="w-full h-64">
      <ResponsiveHeatMapCanvas
        data={data.rows}
        margin={heatmapMargin}
        valueFormat=">-.2f"
        axisTop={null}
        axisBottom={{ legend: "Layer", legendOffset: 30, tickSize: 0, tickPadding: 6 }}
        axisLeft={{ tickSize: 0, tickPadding: 6 }}
        label={(cell) => cell.data.label || ""}
        labelTextColor={(cell) => {
          const value = cell.data.y;
          return value !== null && value > 0.5 ? "#ffffff" : "#000000";
        }}
        colors={{ type: "sequential", scheme: "blues", minValue: 0, maxValue: 1 }}
        hoverTarget="cell"
        inactiveOpacity={1}
        theme={resolvedTheme}
        animate={false}
        legends={[]}
      />
    </div>
  );
}
