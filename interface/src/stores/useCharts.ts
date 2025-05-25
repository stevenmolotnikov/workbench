import { create } from "zustand";
import { Layout } from "@/types/workspace";
import { LineGraphData, HeatmapData } from "@/types/charts";

export type ChartData =
    | { type: "lineGraph"; data: LineGraphData }
    | { type: "heatmap"; data: HeatmapData };

export interface GridPosition {
    chartMode: number | undefined; // Index into the modes array
    chartData: ChartData | null;
}

interface LensWorkbenchState {
    layout: Layout;
    gridPositions: GridPosition[];

    // Layout management
    setLayout: (layout: Layout) => void;

    // Grid position management
    setChartMode: (position: number, chartModeIndex: number) => void;
    removeChart: (position: number) => void;

    // Chart data management
    setChartData: (position: number, chartData: ChartData | null) => void;
    getChartData: (position: number) => ChartData | null;
    getAllChartData: () => Array<{ position: number; data: ChartData }>;
}

const getInitialGridPositions = (layout: Layout): GridPosition[] => {
    let count: number;
    switch (layout) {
        case "2x1":
            count = 2;
            break;
        case "2x2":
            count = 4;
            break;
        case "1x1":
            count = 1;
            break;
        default:
            throw new Error(`Invalid layout: ${layout}`);
    }
    return Array.from({ length: count }, () => ({
        chartMode: undefined,
        chartData: null,
    }));
};

export const useCharts = create<LensWorkbenchState>((set, get) => ({
    layout: "1x1",
    gridPositions: getInitialGridPositions("1x1"),

    setLayout: (layout) => {
        set((state) => {
            const newCount = layout === "2x1" ? 2 : layout === "2x2" ? 4 : 1;
            const currentPositions = state.gridPositions;

            let newGridPositions: GridPosition[];

            if (newCount >= currentPositions.length) {
                // Expanding or same size: keep existing positions and add new empty ones
                newGridPositions = [...currentPositions];

                // Add new empty positions if needed
                while (newGridPositions.length < newCount) {
                    newGridPositions.push({
                        chartMode: undefined,
                        chartData: null,
                    });
                }
            } else {
                // Shrinking: truncate to new size (chart data automatically removed)
                newGridPositions = currentPositions.slice(0, newCount);
            }

            return {
                layout,
                gridPositions: newGridPositions,
            };
        });
    },

    setChartMode: (position, chartModeIndex) => {
        set((state) => {
            const newGridPositions = [...state.gridPositions];
            if (newGridPositions[position]) {
                newGridPositions[position] = {
                    ...newGridPositions[position],
                    chartMode: chartModeIndex,
                    chartData: null, // Clear data when changing chart type
                };
            }
            return { gridPositions: newGridPositions };
        });
    },

    removeChart: (position) => {
        set((state) => {
            const newGridPositions = [...state.gridPositions];

            if (newGridPositions[position]) {
                newGridPositions[position] = {
                    chartMode: undefined,
                    chartData: null,
                };
            }

            return { gridPositions: newGridPositions };
        });
    },

    setChartData: (position, chartData) => {
        set((state) => {
            const newGridPositions = [...state.gridPositions];
            if (newGridPositions[position]) {
                newGridPositions[position] = {
                    ...newGridPositions[position],
                    chartData: chartData,
                };
            }
            return { gridPositions: newGridPositions };
        });
    },

    getChartData: (position) => {
        const { gridPositions } = get();
        return gridPositions[position]?.chartData || null;
    },

    getAllChartData: () => {
        const { gridPositions } = get();
        const result: Array<{ position: number; data: ChartData }> = [];

        gridPositions.forEach((gridPosition, position) => {
            if (gridPosition.chartData !== null) {
                result.push({ position, data: gridPosition.chartData });
            }
        });

        return result;
    },
}));
