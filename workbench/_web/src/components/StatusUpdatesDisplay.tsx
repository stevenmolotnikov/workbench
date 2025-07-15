import React from "react";
import { useWorkspace } from "@/stores/useWorkspace";

export function StatusUpdatesDisplay() {
    const { jobStatus } = useWorkspace();

    return (
        <div className="border rounded h-8 px-2 flex items-center">
            <p className="text-sm text-muted-foreground">Status: {jobStatus}</p>
        </div>
    );
}