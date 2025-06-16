// api/status-update.js
import { NextRequest, NextResponse } from "next/server";
import { broadcastUpdate } from "../status-stream/route";

export async function POST(request: NextRequest) {
    try {
        const { status, progress, data } = await request.json();
        
        // Extract job_id from URL search params
        const url = new URL(request.url);
        const jobId = url.searchParams.get('job_id') || undefined;

        console.log("Received update:", { status, progress, data, jobId });

        // Broadcast the update to specific job subscribers or all clients if no job_id
        broadcastUpdate({ status, progress, data, jobId });

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Error in status-update API:", error);
        return NextResponse.json(
            { error: "Failed to process status update" },
            { status: 500 }
        );
    }
}
