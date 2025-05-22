import { create } from 'zustand';
import { Layout, ChartMode } from '@/types/workspace';
import { LineGraphData } from '@/types/lens';
import { ActivationPatchingResponse } from '@/types/patching';

// Chart data can be either type depending on the chart mode
export type ChartData = LineGraphData | ActivationPatchingResponse;

// Each grid position can have a chart type and its associated data
export interface GridPosition {
    chartType: number | undefined; // Index into the modes array
    chartData: ChartData | null;
    isLoading: boolean;
}

interface LensWorkbenchState {
    layout: Layout;
    gridPositions: GridPosition[];
    
    // Layout management
    setLayout: (layout: Layout) => void;
    
    // Grid position management
    setChartType: (position: number, chartTypeIndex: number) => void;
    removeChart: (position: number) => void;
    setChartData: (position: number, data: ChartData | null) => void;
    setLoading: (position: number, isLoading: boolean) => void;
    
    // Utility functions
    getGridPositionCount: () => number;
    clearAllData: () => void;
    getPopulatedPositions: () => { position: number; chartType: number }[];
}

const getInitialGridPositions = (layout: Layout): GridPosition[] => {
    const count = layout === "2x1" ? 2 : 1;
    return Array.from({ length: count }, () => ({
        chartType: undefined,
        chartData: null,
        isLoading: false,
    }));
};

export const useLensWorkbench = create<LensWorkbenchState>((set, get) => ({
    layout: "1x1",
    gridPositions: getInitialGridPositions("1x1"),
    
    setLayout: (layout) => {
        set({
            layout,
            gridPositions: getInitialGridPositions(layout),
        });
    },
    
    setChartType: (position, chartTypeIndex) => {
        set((state) => {
            const newGridPositions = [...state.gridPositions];
            if (newGridPositions[position]) {
                newGridPositions[position] = {
                    ...newGridPositions[position],
                    chartType: chartTypeIndex,
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
                    chartType: undefined,
                    chartData: null,
                    isLoading: false,
                };
            }
            return { gridPositions: newGridPositions };
        });
    },
    
    setChartData: (position, data) => {
        set((state) => {
            const newGridPositions = [...state.gridPositions];
            if (newGridPositions[position]) {
                newGridPositions[position] = {
                    ...newGridPositions[position],
                    chartData: data,
                };
            }
            return { gridPositions: newGridPositions };
        });
    },
    
    setLoading: (position, isLoading) => {
        set((state) => {
            const newGridPositions = [...state.gridPositions];
            if (newGridPositions[position]) {
                newGridPositions[position] = {
                    ...newGridPositions[position],
                    isLoading,
                };
            }
            return { gridPositions: newGridPositions };
        });
    },
    
    getGridPositionCount: () => {
        const { layout } = get();
        return layout === "2x1" ? 2 : 1;
    },
    
    clearAllData: () => {
        set((state) => ({
            gridPositions: state.gridPositions.map((pos) => ({
                ...pos,
                chartData: null,
                isLoading: false,
            })),
        }));
    },
    
    getPopulatedPositions: () => {
        const { gridPositions } = get();
        return gridPositions
            .map((pos, index) => ({ position: index, chartType: pos.chartType }))
            .filter((item): item is { position: number; chartType: number } => 
                item.chartType !== undefined
            );
    },
})); 