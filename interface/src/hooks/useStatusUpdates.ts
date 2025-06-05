import { useState, useEffect, useRef } from 'react';

export interface StatusUpdate {
    type: 'connected' | 'status-update';
    status?: string;
    progress?: number;
    data?: Record<string, unknown>;
    message?: string;
    timestamp?: string;
}

export interface UseStatusUpdatesReturn {
    updates: StatusUpdate[];
    latestUpdate: StatusUpdate | null;
    isConnected: boolean;
    error: string | null;
    clearUpdates: () => void;
}

export function useStatusUpdates(): UseStatusUpdatesReturn {
    const [updates, setUpdates] = useState<StatusUpdate[]>([]);
    const [latestUpdate, setLatestUpdate] = useState<StatusUpdate | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        // Create EventSource connection
        const eventSource = new EventSource('/api/status-stream');
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            setIsConnected(true);
            setError(null);
        };

        eventSource.onmessage = (event) => {
            try {
                const update: StatusUpdate = JSON.parse(event.data);
                
                setUpdates(prev => [...prev, update]);
                setLatestUpdate(update);
                
                if (update.type === 'connected') {
                    setIsConnected(true);
                }
            } catch (err) {
                console.error('Error parsing SSE message:', err);
                setError('Failed to parse update message');
            }
        };

        eventSource.onerror = (event) => {
            console.error('SSE connection error:', event);
            setIsConnected(false);
            setError('Connection to status updates failed');
        };

        // Cleanup on unmount
        return () => {
            eventSource.close();
            eventSourceRef.current = null;
        };
    }, []);

    const clearUpdates = () => {
        setUpdates([]);
        setLatestUpdate(null);
    };

    return {
        updates,
        latestUpdate,
        isConnected,
        error,
        clearUpdates,
    };
} 