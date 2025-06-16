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
    configuringPosition: number | null;
    setConfiguringPosition: (position: number | null) => void;

    layout: Layout; // Number of charts per row
    gridPositions: GridPosition[];

    // Layout management
    setLayout: (layout: Layout) => void;
    clearGridPositions: () => void;

    // Grid position management
    setChartMode: (position: number, chartModeIndex: number) => void;
    removeChart: (position: number) => void;
    addChart: () => void; // Add a new chart

    // Chart data management
    setChartData: (position: number, chartData: ChartData | null) => void;
    getChartData: (position: number) => ChartData | null;
    setGridPositions: (gridPositions: GridPosition[]) => void;
}

const getInitialGridPositions = (count: number = 1): GridPosition[] => {
    return Array.from({ length: count }, () => ({
        chartMode: undefined,
        chartData: null,
    }));
};

export const useCharts = create<LensWorkbenchState>((set, get) => ({
    configuringPosition: null,
    setConfiguringPosition: (position) => set({ configuringPosition: position }),

    layout: "2x1", // Default to 2 charts per row
    gridPositions: [], // Start with no charts

    clearGridPositions: () => {
        set({ gridPositions: [] });
    },

    setLayout: (layout) => {
        set({ layout });
    },

    setChartMode: (position, chartModeIndex) => {
        set((state) => {
            const newGridPositions = [...state.gridPositions];
            
            // If position is beyond current length, add new positions up to that point
            while (newGridPositions.length <= position) {
                newGridPositions.push({
                    chartMode: undefined,
                    chartData: null,
                });
            }
            
            newGridPositions[position] = {
                ...newGridPositions[position],
                chartMode: chartModeIndex,
                chartData: null, // Clear data when changing chart type
            };
            
            return { gridPositions: newGridPositions };
        });
    },

    removeChart: (position) => {
        set((state) => {
            const newGridPositions = [...state.gridPositions];
            newGridPositions.splice(position, 1);
            return { gridPositions: newGridPositions };
        });
    },

    addChart: () => {
        set((state) => {
            const newGridPositions = [...state.gridPositions];
            newGridPositions.push({
                chartMode: undefined,
                chartData: null,
            });
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

    setGridPositions: (gridPositions) => {
        set({ gridPositions });
    },
}));
