import React from "react";
import { useStatusUpdates } from "@/hooks/useStatusUpdates";

export function StatusUpdatesDisplay() {
    const { latestUpdate, isConnected, isEnabled, error } = useStatusUpdates();

    // Determine the message to display
    const getMessage = () => {
        if (error) {
            return `Connection error: ${error}`;
        }

        if (!isConnected && isEnabled) {
            return "Connecting to status updates...";
        }

        if (latestUpdate?.type === "job-sent") {
            return "Job sent";
        }

        if (latestUpdate?.type === "status-update") {
            const progressText =
                latestUpdate.progress !== undefined ? ` (${latestUpdate.progress}%)` : "";
            return `${latestUpdate.status}${progressText}`;
        }

        if (latestUpdate?.type === "connected") {
            return latestUpdate.message || "Connected to status updates";
        }

        if (!isEnabled && !latestUpdate) {
            return "No active requests...";
        }

        return "Waiting for updates...";
    };

    // Determine the status type for styling
    const getStatusType = () => {
        if (error || (!isConnected && isEnabled)) {
            return "error";
        }

        if (latestUpdate?.type === "job-sent") {
            return "info";
        }

        if (latestUpdate?.type === "status-update") {
            const status = latestUpdate.status?.toLowerCase();
            if (status?.includes("success") || status?.includes("complete")) {
                return "success";
            }
            if (status?.includes("error") || status?.includes("fail")) {
                return "error";
            }
            if (status?.includes("loading") || status?.includes("processing")) {
                return "loading";
            }
        }

        if (!isEnabled && !latestUpdate) {
            return "ready";
        }

        return "info";
    };

    return (
        <div
            className={`flex items-center justify-center px-3 border text-xs rounded h-8 ${
                getStatusType() === "error" ? "bg-red-500/30" : "bg-transparent"
            }`}
        >
            <div
                className={`w-1.5 h-1.5 rounded-full mr-2 ${
                    getStatusType() === "error"
                        ? "bg-red-500"
                        : getStatusType() === "success"
                        ? "bg-green-500"
                        : getStatusType() === "loading"
                        ? "bg-blue-500 animate-pulse"
                        : getStatusType() === "ready"
                        ? "bg-gray-400"
                        : "bg-slate-400"
                }`}
            />
            {getMessage()}
        </div>
    );
}
