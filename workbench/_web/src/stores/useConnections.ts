import { create } from 'zustand';
import type { Connection } from '@/types/patching';

interface ConnectionsState {
    connections: Connection[];
    isDragging: boolean;
    currentConnection: Partial<Connection>;
    selectedEdgeIndex: number | null;

    setConnections: (connections: Connection[]) => void;
    addConnection: (connection: Connection) => void;
    removeConnection: (tokenIndex: number, counterIndex: number) => void;
    removeConnectionByIndex: (index: number) => void;
    clearConnections: () => void;
    setIsDragging: (isDragging: boolean) => void;
    setCurrentConnection: (connection: Partial<Connection>) => void;
    setSelectedEdgeIndex: (index: number | null) => void;
}

export const useConnections = create<ConnectionsState>((set, get) => ({
    connections: [],
    isDragging: false,
    currentConnection: {},
    selectedEdgeIndex: null,

    setConnections: (connections) => set({ connections }),

    addConnection: (connection) => set((state) => ({
        connections: [...state.connections, connection]
    })),

    removeConnection: (tokenIndex, counterIndex) => set((state) => ({
        connections: state.connections.filter(conn => 
            !conn.start.tokenIndices.includes(tokenIndex) && conn.start.counterIndex !== counterIndex
        )
    })),

    removeConnectionByIndex: (index) => set((state) => ({
        connections: state.connections.filter((_, i) => i !== index)
    })),

    clearConnections: () => set({ connections: [] }),

    setIsDragging: (isDragging) => set({ isDragging }),

    setCurrentConnection: (connection) => set({ currentConnection: connection }),

    setSelectedEdgeIndex: (index) => set({ selectedEdgeIndex: index }),
})); 