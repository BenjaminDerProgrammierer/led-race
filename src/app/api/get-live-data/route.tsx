import { getClient, LEDRaceData, subscribeToRaceStatus } from "@/lib/mqtt";

export type LiveDataResponse = SLiveDataResponse | ELiveDataResponse;

interface SLiveDataResponse {
    success: true;
    result: LEDRaceData;
}

interface ELiveDataResponse {
    success: false;
    error: string;
}

/**
 * GET /api/get-live-data
 * Returns the LEDRaceData from the MQTT broker as SSE (Server-Sent Events, MQTT subscription)
 */
export async function GET(request: Request) {
    try {
        const client = getClient();

        // Create a ReadableStream to push SSE events
        const stream = new ReadableStream({
            start(controller) {
                // Subscribe to race status updates
                subscribeToRaceStatus(client, (data) => {
                    const payload = `data: ${JSON.stringify(data)}\n\n`;
                    controller.enqueue(new TextEncoder().encode(payload));
                });

                // Handle client disconnect
                request.signal.addEventListener('abort', () => {
                    try {
                        client.end(true);
                    } catch {
                        // ignore
                    }
                    try {
                        controller.close();
                    } catch {
                        // ignore
                    }
                });
            },
            cancel() {
                try {
                    client.end(true);
                } catch {
                    // ignore
                }
            }
        });

        return new Response(stream, {
            status: 200, headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                Connection: 'keep-alive'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: (error as Error).message } as ELiveDataResponse), { status: 500 });
    }
}
