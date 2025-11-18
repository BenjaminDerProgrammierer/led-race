import mqtt, { MqttClient } from "mqtt";

/**
 * Data structure representing the running state of the race (MQTT topic: Open_LED_Race/RaceRunning)
 */
export interface RaceRunning {
    P1_Time_ms: number,
    P2_Time_ms: number,
    P3_Time_ms: number,
    P1_Steps: number,
    P2_Steps: number,
    P3_Steps: number
}

/**
 * Data structure representing the full LED race data from the MQTT broker
 */
export interface LEDRaceData {
    WiFiStatus: string;
    Error_Message: string;
    WiFi_SSID: string;
    WiFi_IP: string;
    WiFi_mac: string;
    RaceStatus: RunningState;
    RaceRunning: RaceRunning;
}

/**
 * Data structure representing a smaller subset of the full LED race data used for live updates
 */
export interface SmallLEDRaceData {
    RaceStatus: RunningState;
    RaceRunning: RaceRunning;
}

/**
 * Data structure representing player data
 */
export interface PlayerData {
    time: number;
    score: number;
}

/**
 * Type representing the state of a player
 */
export type PlayerState = "wait" | "run" | "runSlow" | "runFast";

/**
 * Type representing the running state of the race
 */
export type RunningState = "idle" | "prepareForStart" | "run" | "finish";

/**
 * Original race state strings from the MQTT broker
 */
type OriginalRaceState = "Stopped" | "Prepare4Race" | "Running" | "Finish";

/**
 * Create and return an MQTT client using environment variables MQTT_BROKER_URL, MQTT_USERNAME, MQTT_PASSWORD
 * @returns MQTT client
 */
export function getClient() {
    if (!process.env.MQTT_BROKER_URL || !process.env.MQTT_USERNAME || !process.env.MQTT_PASSWORD) {
        throw new Error("Missing MQTT configuration in environment variables");
    }

    const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
    const MQTT_USERNAME = process.env.MQTT_USERNAME;
    const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

    const client = mqtt.connect(MQTT_BROKER_URL, {
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD
    });

    return client;
}

/**
 * Get the current race data once
 * @param client MQTT client
 * @returns Promise resolving to LEDRaceData
 */
export function getRaceData(client: MqttClient): Promise<LEDRaceData> {
    return new Promise((resolve, reject) => {
        const raceData: Partial<LEDRaceData> = {};

        // Subscribe to relevant topics, retained messages will be sent immediately -> we get the current state in a few ms
        client.on("connect", () => {
            client.subscribe("Open_LED_Race/WiFiStatus");
            client.subscribe("Open_LED_Race/Error_Message");
            client.subscribe("Open_LED_Race/WiFi_SSID");
            client.subscribe("Open_LED_Race/WiFi_IP");
            client.subscribe("Open_LED_Race/WiFi_mac");
            client.subscribe("Open_LED_Race/RaceStatus");
            client.subscribe("Open_LED_Race/RaceRunning");
        });

        client.on("message", (topic, message) => {
            // message is Buffer
            const msgString = message.toString();

            switch (topic) {
                case "Open_LED_Race/WiFiStatus":
                    raceData.WiFiStatus = msgString;
                    break;
                case "Open_LED_Race/Error_Message":
                    raceData.Error_Message = msgString;
                    break;
                case "Open_LED_Race/WiFi_SSID":
                    raceData.WiFi_SSID = msgString;
                    break;
                case "Open_LED_Race/WiFi_IP":
                    raceData.WiFi_IP = msgString;
                    break;
                case "Open_LED_Race/WiFi_mac":
                    raceData.WiFi_mac = msgString;
                    break;
                case "Open_LED_Race/RaceStatus":
                    raceData.RaceStatus = parseRaceStatus(msgString as OriginalRaceState);
                    break;
                case "Open_LED_Race/RaceRunning":
                    raceData.RaceRunning = JSON.parse(msgString);
                    break;
            }

            // Once we have all data, resolve the promise
            if (raceData.WiFiStatus && raceData.Error_Message && raceData.WiFi_SSID && raceData.WiFi_IP && raceData.WiFi_mac && raceData.RaceStatus && raceData.RaceRunning) {
                resolve(raceData as LEDRaceData);
                client.end();
            }
        });

        // In case of error, reject the promise
        client.on("error", (err) => {
            reject(err);
            client.end();
        });
    });
}

/**
 * Subscribe to race status updates
 * @param client MQTT client
 * @param callback Callback to invoke on new data
 */
export function subscribeToRaceStatus(client: MqttClient, callback: (data: SmallLEDRaceData) => void) {
    const raceData: Partial<SmallLEDRaceData> = {};

    client.on("connect", () => {
        client.subscribe("Open_LED_Race/RaceStatus");
        client.subscribe("Open_LED_Race/RaceRunning");
    });

    client.on("message", (topic, message) => {
        const msgString = message.toString();

        switch (topic) {
            case "Open_LED_Race/RaceStatus":
                raceData.RaceStatus = parseRaceStatus(msgString as OriginalRaceState);
                break;
            case "Open_LED_Race/RaceRunning":
                raceData.RaceRunning = JSON.parse(msgString);
                break;
        }

        // Once we have both RaceStatus and RaceRunning, invoke the callback
        if (raceData.RaceStatus && raceData.RaceRunning) {
            callback(raceData as SmallLEDRaceData);
        }
    });
}

/**
 * Parse race status string to RunningState
 * @param status Input string
 * @returns Corresponding RunningState
 */
function parseRaceStatus(status: OriginalRaceState): RunningState {
    switch (status) {
        case "Stopped":
            return "idle";
        case "Prepare4Race":
            return "prepareForStart";
        case "Running":
            return "run";
        case "Finish":
            return "finish";
    }
}
