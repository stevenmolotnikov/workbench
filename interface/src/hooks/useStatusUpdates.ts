import { create } from 'zustand';

export interface StatusUpdate {
    type: 'connected' | 'status-update' | 'job-sent';
    status?: string;
    progress?: number;
    data?: Record<string, unknown>;
    message?: string;
    timestamp?: string;
}

interface StatusUpdatesState {
    updates: StatusUpdate[];
    latestUpdate: StatusUpdate | null;
    isConnected: boolean;
    isEnabled: boolean;
    error: string | null;
    eventSource: EventSource | null;
    
    // Actions
    clearUpdates: () => void;
    startStatusUpdates: () => void;
    stopStatusUpdates: () => void;
    setConnected: (connected: boolean) => void;
    setError: (error: string | null) => void;
    addUpdate: (update: StatusUpdate) => void;
}

export const useStatusUpdates = create<StatusUpdatesState>((set, get) => ({
    updates: [],
    latestUpdate: null,
    isConnected: false,
    isEnabled: false,
    error: null,
    eventSource: null,

    clearUpdates: () => {
        set({ updates: [], latestUpdate: null });
    },

    setConnected: (connected: boolean) => {
        set({ isConnected: connected });
    },

    setError: (error: string | null) => {
        set({ error });
    },

    addUpdate: (update: StatusUpdate) => {
        set((state) => ({
            updates: [...state.updates, update],
            latestUpdate: update
        }));
    },

    stopStatusUpdates: () => {
        const { eventSource } = get();
        if (eventSource) {
            eventSource.close();
        }
        set({
            isConnected: false,
            isEnabled: false,
            error: null,
            eventSource: null
        });
    },

    startStatusUpdates: () => {
        const { isEnabled, eventSource } = get();
        
        // Don't start if already enabled
        if (isEnabled || eventSource) {
            return;
        }

        // Clear previous updates when starting new job
        set({ 
            isEnabled: true, 
            error: null,
            updates: [],
            latestUpdate: null
        });
        
        // Set initial "Job sent" status
        const jobSentUpdate: StatusUpdate = {
            type: 'job-sent',
            message: 'Job sent',
            timestamp: new Date().toISOString()
        };
        
        get().addUpdate(jobSentUpdate);

        // Create EventSource connection
        const newEventSource = new EventSource('/api/status-stream');
        set({ eventSource: newEventSource });

        newEventSource.onopen = () => {
            get().setConnected(true);
            get().setError(null);
        };

        newEventSource.onmessage = (event) => {
            try {
                const update: StatusUpdate = JSON.parse(event.data);
                get().addUpdate(update);
                
                if (update.type === 'connected') {
                    get().setConnected(true);
                }
            } catch (err) {
                console.error('Error parsing SSE message:', err);
                get().setError('Failed to parse update message');
            }
        };

        newEventSource.onerror = (event) => {
            console.error('SSE connection error:', event);
            get().setConnected(false);
            get().setError('Connection to status updates failed');
        };
    },
})); 