import { NextRequest } from "next/server";

// Define the update type
interface StatusUpdate {
    status: string;
    progress?: number;
    data?: Record<string, unknown>;
}

// Store active connections
const connections = new Set<ReadableStreamDefaultController>();

export async function GET(request: NextRequest) {
    const stream = new ReadableStream({
        start(controller) {
            // Add this connection to our set
            connections.add(controller);
            
            // Send initial connection message
            controller.enqueue(`data: ${JSON.stringify({ 
                type: 'connected', 
                message: 'Connected to status updates' 
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

// Function to broadcast updates to all connected clients
export function broadcastUpdate(update: StatusUpdate) {
    console.log('Broadcasting update to', connections.size, 'connections:', update);
    const message = `data: ${JSON.stringify({
        type: 'status-update',
        timestamp: new Date().toISOString(),
        ...update
    })}\n\n`;
    
    // Send to all connected clients
    connections.forEach((controller) => {
        try {
            controller.enqueue(message);
        } catch (error) {
            console.error('Error sending to connection:', error);
            // Remove dead connections
            connections.delete(controller);
        }
    });
} 