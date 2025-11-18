import { getClient, getRaceData, LEDRaceData } from "@/lib/mqtt";

export type CurrentDataResponse = SCurrentDataResponse | ECurrentDataResponse;

interface SCurrentDataResponse {
    success: true;
    result: LEDRaceData;
}

interface ECurrentDataResponse {
    success: false;
    error: string;
}

/**
 * GET /api/get-current-data
 * Returns the current LEDRaceData from the MQTT broker
 */
export async function GET() {
    try {
        const client = getClient();
        const data = await getRaceData(client);

        return new Response(JSON.stringify({ success: true, result: data } as SCurrentDataResponse), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: (error as Error).message } as ECurrentDataResponse), { status: 500 });
    }
}
