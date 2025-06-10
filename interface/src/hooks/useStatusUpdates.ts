import { create } from 'zustand';

export interface StatusUpdate {
    type: 'connected' | 'status-update' | 'job-sent';
    status?: string;
    progress?: number;
    data?: Record<string, unknown>;
    message?: string;
    timestamp?: string;
    jobId?: string;
}

interface StatusUpdatesState {
    updates: StatusUpdate[];
    latestUpdate: StatusUpdate | null;
    isConnected: boolean;
    isEnabled: boolean;
    error: string | null;
    eventSource: EventSource | null;
    currentJobId: string | null;

    // Actions
    addUpdate: (update: StatusUpdate) => void;
    setConnected: (connected: boolean) => void;
    setError: (error: string | null) => void;
    startStatusUpdates: (jobId?: string) => void;
    stopStatusUpdates: () => void;
    clearUpdates: () => void;
}

export const useStatusUpdates = create<StatusUpdatesState>((set, get) => ({
    updates: [],
    latestUpdate: null,
    isConnected: false,
    isEnabled: false,
    error: null,
    eventSource: null,
    currentJobId: null,

    addUpdate: (update: StatusUpdate) => {
        set((state) => {
            const newUpdates = [...state.updates, update];
            return {
                updates: newUpdates,
                latestUpdate: update,
            };
        });
    },

    setConnected: (connected: boolean) => {
        set({ isConnected: connected });
    },

    setError: (error: string | null) => {
        set({ error });
    },

    clearUpdates: () => {
        set({
            updates: [],
            latestUpdate: null,
        });
    },

    stopStatusUpdates: () => {
        const { eventSource } = get();
        if (eventSource) {
            eventSource.close();
        }
        set({
            isEnabled: false,
            isConnected: false,
            eventSource: null,
            currentJobId: null,
        });
    },

    startStatusUpdates: (jobId?: string) => {
        const { isEnabled, eventSource, currentJobId } = get();
        
        // Don't start if already enabled for the same job
        if (isEnabled && eventSource && currentJobId === jobId) {
            return;
        }
        
        // Stop previous connection if switching jobs
        if (eventSource) {
            eventSource.close();
        }

        // Clear previous updates when starting new job
        set({ 
            isEnabled: true, 
            error: null,
            updates: [],
            latestUpdate: null,
            currentJobId: jobId
        });
        
        // Set initial "Job sent" status
        const jobSentUpdate: StatusUpdate = {
            type: 'job-sent',
            message: 'Job sent',
            timestamp: new Date().toISOString(),
            jobId
        };
        
        get().addUpdate(jobSentUpdate);

        // Create EventSource connection with optional job_id parameter
        const url = jobId ? `/api/status-stream?job_id=${jobId}` : '/api/status-stream';
        const newEventSource = new EventSource(url);
        set({ eventSource: newEventSource });

        newEventSource.onopen = () => {
            get().setConnected(true);
            get().setError(null);
        };

        newEventSource.onmessage = (event) => {
            try {
                const update: StatusUpdate = JSON.parse(event.data);
                
                // Only process updates for the current job or global updates
                const currentJob = get().currentJobId;
                if (!currentJob || !update.jobId || update.jobId === currentJob) {
                    get().addUpdate(update);
                    
                    if (update.type === 'connected') {
                        get().setConnected(true);
                    }
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