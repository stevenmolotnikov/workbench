import { NextRequest } from "next/server";

// Define the update type
interface StatusUpdate {
    status: string;
    progress?: number;
    data?: Record<string, unknown>;
    jobId?: string;
}

// Store active connections with their subscribed job IDs
const connections = new Map<ReadableStreamDefaultController, Set<string>>();

export async function GET(request: NextRequest) {
    // Extract job_id from URL search params to subscribe to specific jobs
    const url = new URL(request.url);
    const jobId = url.searchParams.get('job_id');
    
    const stream = new ReadableStream({
        start(controller) {
            // Initialize job subscriptions for this connection
            const jobSubscriptions = new Set<string>();
            if (jobId) {
                jobSubscriptions.add(jobId);
            }
            
            // Add this connection to our map
            connections.set(controller, jobSubscriptions);
            
            // Send initial connection message
            controller.enqueue(`data: ${JSON.stringify({ 
                type: 'connected', 
                message: `Connected to status updates${jobId ? ` for job ${jobId}` : ''}`,
                jobId
            })}\n\n`);
            
            // Clean up when connection closes
            request.signal.addEventListener('abort', () => {
                connections.delete(controller);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
        },
    });
}

// Function to broadcast updates to specific job subscribers or all clients
export function broadcastUpdate(update: StatusUpdate) {
    const targetJobId = update.jobId;
    let targetConnections: ReadableStreamDefaultController[] = [];
    
    if (targetJobId) {
        // Send only to clients subscribed to this specific job
        connections.forEach((jobSubscriptions, controller) => {
            if (jobSubscriptions.has(targetJobId) || jobSubscriptions.size === 0) {
                targetConnections.push(controller);
            }
        });
        console.log(`Broadcasting update for job ${targetJobId} to`, targetConnections.length, 'connections:', update);
    } else {
        // Send to all connections if no job ID specified
        targetConnections = Array.from(connections.keys());
        console.log('Broadcasting update to all', targetConnections.length, 'connections:', update);
    }
    
    const message = `data: ${JSON.stringify({
        type: 'status-update',
        timestamp: new Date().toISOString(),
        ...update
    })}\n\n`;
    
    // Send to target connections
    targetConnections.forEach((controller) => {
        try {
            controller.enqueue(message);
        } catch (error) {
            console.error('Error sending to connection:', error);
            // Remove dead connections
            connections.delete(controller);
        }
    });
} 