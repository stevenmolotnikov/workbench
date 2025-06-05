// api/status-update.js
import { NextRequest, NextResponse } from "next/server";
import { broadcastUpdate } from "../status-stream/route";

export async function POST(request: NextRequest) {
    try {
        const { status, progress, data } = await request.json();

        console.log("Received update:", { status, progress, data });

        // Broadcast the update to all connected SSE clients
        broadcastUpdate({ status, progress, data });

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Error in status-update API:", error);
        return NextResponse.json(
            { error: "Failed to process status update" },
            { status: 500 }
        );
    }
}
