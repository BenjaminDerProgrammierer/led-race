import mqtt, { MqttClient } from "mqtt";

/**
 * Data structure representing the running state of the race (MQTT topic: Open_LED_Race/RaceRunning)
 */
export interface RaceData {
    time: number,
    pos1: number,
    pos2: number,
    pos3: number
}

/**
 * Data structure representing a smaller subset of the full LED race data used for live updates
 */
export interface LEDRaceData {
    raceStatus: GameState;
    raceData: RaceData;
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
 * Type representing the state of the race
 */
export type GameState = "Stopped" | "Countdown" | "Running" | "Finished";

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
            client.subscribe("Open_LED_Race/raceStatus");
            client.subscribe("Open_LED_Race/raceData");
        });

        client.on("message", (topic, message) => {
            // message is Buffer
            const msgString = message.toString();

            switch (topic) {
                case "Open_LED_Race/raceStatus":
                    raceData.raceStatus = msgString as GameState;
                    break;
                case "Open_LED_Race/raceData":
                    raceData.raceData = JSON.parse(msgString);
                    break;
            }

            // Once we have all data, resolve the promise
            if (raceData.raceStatus && raceData.raceData) {
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
export function subscribeToRaceStatus(client: MqttClient, callback: (data: LEDRaceData) => void) {
    const raceData: Partial<LEDRaceData> = {};

    client.on("connect", () => {
        client.subscribe("Open_LED_Race/raceStatus");
        client.subscribe("Open_LED_Race/raceData");
    });

    client.on("message", (topic, message) => {
        const msgString = message.toString();

        switch (topic) {
            case "Open_LED_Race/raceStatus":
                raceData.raceStatus = msgString as GameState;
                break;
            case "Open_LED_Race/raceData":
                raceData.raceData = JSON.parse(msgString);
                break;
        }

        // Once we have both RaceStatus and RaceRunning, invoke the callback
        if (raceData.raceStatus && raceData.raceData) {
            callback(raceData as LEDRaceData);
        }
    });
}
