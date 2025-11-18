'use client';
import { useEffect, useRef, useState } from "react";
import styles from './GameStatusComponent.module.css';

import { SmallLEDRaceData } from "@/lib/mqtt";

export default function GameStatusComponent() {
    const [lastUpdate, setLastUpdate] = useState(null as Date | null);
    const [runningState, setRunningState] = useState<string | null>(null);
    const [runningTime, setRunningTime] = useState<number | null>(null);

    const esRef = useRef<EventSource | null>(null);
    const reconnectRef = useRef<number>(0);

    useEffect(() => {
        let cancelled = false;

        function connect() {
            if (cancelled) return;
            try {
                const es = new EventSource('/api/get-live-data');
                esRef.current = es;

                es.onmessage = (ev) => {
                    try {
                        const parsed = JSON.parse(ev.data) as SmallLEDRaceData;

                        // Set running state
                        let state: string = "";
                        switch (parsed.RaceStatus) {
                            case "idle":
                                state = "Game Stopped";
                                break;
                            case "prepareForStart":
                                state = "Prepare for Start!";
                                break;
                            case "run":
                                state = "Race in Progress...";
                                break;
                            case "finish":
                                state = "Race Finished!";
                                break;
                        }
                        setRunningState(state);
                        setRunningTime(parsed.RaceRunning.P1_Time_ms); // just show P1 time as reference
                        setLastUpdate(new Date());

                        // reset reconnect backoff
                        reconnectRef.current = 0;
                    } catch (e) {
                        console.error('Failed to parse SSE data', e);
                    }
                };

                es.onerror = () => {
                    // try to reconnect with backoff
                    if (es.readyState === EventSource.CLOSED) {
                        es.close();
                    }
                    es.close();

                    // exponential backoff
                    const backoff = Math.min(30000, 1000 * Math.pow(2, reconnectRef.current));
                    reconnectRef.current += 1;
                    setTimeout(connect, backoff);
                };
            } catch {
                const backoff = Math.min(30000, 1000 * Math.pow(2, reconnectRef.current));
                reconnectRef.current += 1;
                setTimeout(connect, backoff);
            }
        }

        connect();

        return () => {
            cancelled = true;
            if (esRef.current) {
                esRef.current.close();
            }
        };
    }, []);

    return (
        <p className={styles.status}>
            {runningState} <br />
            {runningState == "Race in Progress..." && runningTime && (runningTime / 1000).toFixed(2) + " s"} <br />
        </p>
    );
}
