import { create } from "zustand";
import type { Layout } from "@/types/workspace";
import type { LineGraphData, HeatmapData } from "@/types/charts";

export type ChartData =
    | { type: "lineGraph"; data: LineGraphData }
    | { type: "heatmap"; data: HeatmapData };

export interface GridPosition {
    chartMode: number | undefined; // Index into the modes array
    chartData: ChartData | null;
    completion_ids: string[];
}

interface LensWorkbenchState {
    configuringPosition: number | null;
    setConfiguringPosition: (position: number | null) => void;
    completionIndex: number | null;
    setCompletionIndex: (index: number | null) => void;

    // Two-phase chart selection
    selectedChartType: number | null;
    setSelectedChartType: (chartType: number | null) => void;
    selectionPhase: 'type' | 'destination' | null;
    setSelectionPhase: (phase: 'type' | 'destination' | null) => void;

    pushCompletionId: (position: number, completionId: string) => void;

    layout: Layout; // Number of charts per row
    gridPositions: GridPosition[];

    // Layout management
    setLayout: (layout: Layout) => void;
    clearGridPositions: () => void;

    // Grid position management
    setChartMode: (position: number, chartModeIndex: number) => void;
    removeChart: (position: number) => void;

    // Chart data management
    setChartData: (position: number, chartData: ChartData | null) => void;
    getChartData: (position: number) => ChartData | null;
    setGridPositions: (gridPositions: GridPosition[]) => void;
}

export const useCharts = create<LensWorkbenchState>((set, get) => ({
    configuringPosition: null,
    setConfiguringPosition: (position) => set({ configuringPosition: position }),
    completionIndex: null,
    setCompletionIndex: (index) => set({ completionIndex: index }),

    // Two-phase chart selection state
    selectedChartType: null,
    setSelectedChartType: (chartType) => set({ selectedChartType: chartType }),
    selectionPhase: null,
    setSelectionPhase: (phase) => set({ selectionPhase: phase }),

    pushCompletionId: (position, completionId) => {
        set((state) => {
            const newGridPositions = [...state.gridPositions];
            if (newGridPositions[position].chartData) {
                const chartType = newGridPositions[position].chartData.type;
                if (chartType === "lineGraph") {
                    newGridPositions[position].completion_ids.push(completionId);
                } else if (chartType === "heatmap") {
                    newGridPositions[position].completion_ids = [completionId];
                }
            }
            return { gridPositions: newGridPositions };
        });
    },

    layout: 1, // Default to 1 chart per row
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
                    completion_ids: [],
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
