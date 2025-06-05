import React from 'react';
import { useStatusUpdates } from '@/hooks/useStatusUpdates';
import { TerminalStatusLine } from './TerminalStatus';

export function StatusUpdatesDisplay() {
    const { latestUpdate, isConnected, error } = useStatusUpdates();

    // Determine the message to display
    const getMessage = () => {
        if (error) {
            return `Connection error: ${error}`;
        }
        
        if (!isConnected) {
            return "Connecting to status updates...";
        }
        
        if (latestUpdate?.type === 'status-update') {
            const progressText = latestUpdate.progress !== undefined 
                ? ` (${latestUpdate.progress}%)` 
                : '';
            return `${latestUpdate.status}${progressText}`;
        }
        
        if (latestUpdate?.type === 'connected') {
            return latestUpdate.message || "Connected to status updates";
        }
        
        return "Waiting for updates...";
    };

    // Determine the status type for styling
    const getStatusType = () => {
        if (error || !isConnected) {
            return "error";
        }
        
        if (latestUpdate?.type === 'status-update') {
            const status = latestUpdate.status?.toLowerCase();
            if (status?.includes('success') || status?.includes('complete')) {
                return "success";
            }
            if (status?.includes('error') || status?.includes('fail')) {
                return "error";
            }
            if (status?.includes('loading') || status?.includes('processing')) {
                return "loading";
            }
        }
        
        return "info";
    };

    return (
        <div className="p-2">
            <TerminalStatusLine
                message={getMessage()}
                status={getStatusType()}
                showCursor={getStatusType() === "loading"}
                typewriter={true}
            />
        </div>
    );
} 