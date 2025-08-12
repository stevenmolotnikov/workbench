"use client";

import { ResponsiveLine } from "@nivo/line";
import { LineGraphData } from "@/types/charts";
import { lineTheme } from "../theming";

export function StaticLine({ data }: { data: LineGraphData }) {
  return (
    <div className="w-full h-64">
      <ResponsiveLine
        data={data.lines}
        margin={{ top: 10, right: 10, bottom: 40, left: 50 }}
        yScale={{ type: "linear", min: "auto", max: "auto", stacked: false }}
        axisBottom={{ legend: "Layer", legendOffset: 30, tickSize: 0, tickPadding: 6 }}
        axisLeft={{ legend: "Value", legendOffset: -40, tickSize: 0, tickPadding: 6 }}
        useMesh
        theme={lineTheme}
        colors={{ scheme: "set1" }}
        enableGridX={false}
        animate={false}
        enablePoints={false}
        legends={[]}
        layers={["grid", "axes", "lines", "mesh"]}
      />
    </div>
  );
}
