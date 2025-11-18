'use client';
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from './PlayerComponent.module.css';

import { PlayerData, RunningState, PlayerState, SmallLEDRaceData } from "@/lib/mqtt";

export default function PlayerComponent({ playerId }: Readonly<{ playerId: number }>) {
    const [currentPlayerData, setCurrentPlayerData] = useState<PlayerData | null>(null);
    const [lastUpdate, setLastUpdate] = useState(null as Date | null);
    const [runningState, setRunningState] = useState<RunningState | null>(null);
    const [playerState, setPlayerState] = useState<PlayerState | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);

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
                        setRunningState(parsed.RaceStatus);

                        // Set player data for this player
                        let time;
                        let score;

                        switch (playerId) {
                            case 1:
                                time = parsed.RaceRunning.P1_Time_ms;
                                score = parsed.RaceRunning.P1_Steps;
                                break;
                            case 2:
                                time = parsed.RaceRunning.P2_Time_ms;
                                score = parsed.RaceRunning.P2_Steps;
                                break;
                            case 3:
                                time = parsed.RaceRunning.P3_Time_ms;
                                score = parsed.RaceRunning.P3_Steps;
                                break;
                            default:
                                time = null;
                                score = null;
                                break;
                        }

                        if (time === null || score === null) {
                            setCurrentPlayerData(null);
                        } else {
                            setCurrentPlayerData({
                                time,
                                score,
                            });
                        }

                        // Determine player state (running speed) by comparing current score with last score
                        if (time && score && currentPlayerData) {
                            const timeSinceLastUpdate = (time - currentPlayerData.time) / 1000; // seconds
                            if (timeSinceLastUpdate > 0) {
                                const speed = (score - currentPlayerData.score) / timeSinceLastUpdate; // steps per second
                                console.log(`Player ${playerId} speed: ${speed} steps/s`);

                                if (speed <= 0) {
                                    setPlayerState("wait");
                                } else if (speed < 5) {
                                    setPlayerState("runSlow");
                                } else if (speed < 10) {
                                    setPlayerState("run");
                                } else {
                                    setPlayerState("runFast");
                                }
                            }
                        }

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
    }, [playerId, currentPlayerData]);

    useEffect(() => {
        switch (runningState) {
            case "idle":
                setImageSrc("https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExazFmcW5qaHppdzN5dThyaXI0Mnk0enl0dmE4ZmJtcWRkZnEzMmN5biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1yT902UqU5fcFxjLbH/giphy.gif")
                break;
            case "prepareForStart":
                setImageSrc("https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExc3RqNmV6NDYwbXVmMG9lbGlkcXEwN3FrbzYyanpncG9lb20wdjR3ayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QJvwBSGaoc4eI/giphy.gif")
                break;
            case "run":
                switch (playerState) {
                    case "run":
                        setImageSrc("https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnV0dGM1NDRha3htcmJ1aHR5bzd3MDF4bzB3czJ4YWF0ZWZ6ZDFtZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5UDsrMd6ctz6KDXyIo/giphy.gif")
                        break;
                    case "runSlow":
                        setImageSrc("https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExYzJ1eGxmMnhrYnR5OXJiNjQ5MWN3amE1Y255ejJsYWV2bGIxNHpwZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/nqIuAIxYebIt2/giphy.gif")
                        break;
                    case "runFast":
                        setImageSrc("https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMDF3YzlwZXo2M3FheTRha2NsYzA5c2x6OWY1dXI0aGlmZWllNmtiYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/AYkKBPkrKTOsU2YD3b/giphy.gif");
                        break;
                    case "wait":
                        setImageSrc("https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcG80M2V6Y3lzNGFxa3V4d2VqOG9jNDY1ejMzMnFncHB5YmtnbWwyNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/tXL4FHPSnVJ0A/giphy.gif");
                        break;
                    default:
                        setImageSrc(null);
                }
                break;
            case "finish":
                if (currentPlayerData && currentPlayerData.score >= 290) {
                    setImageSrc("https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGs4dzhubmh5c3JuNGx5cWR1eG1wbGF5Ymt6aGJiYmZvbHJ4cmh1YiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VQ77RNKX0nyaA/giphy.gif");
                    break;
                } else {
                    setImageSrc("https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExZmJ4YXFtYTN4NmVkcmpobXczcTc0MTc1a2U3bzZlZWRxb3o3ZTB4MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hiGVaAnMnrqjGujxOj/giphy.gif");
                }
                break;
        }
    }, [runningState, playerState, currentPlayerData]);

    return (
        <div className={styles.container}>
            <h2 className={styles.playerTitle}>Player {playerId}</h2>
            {currentPlayerData ? (
                <div>
                    {imageSrc && <Image className={styles.image} src={imageSrc} alt={`Player ${playerId} state`} width={480} height={270} unoptimized />}
                    <p className={styles.steps}>{currentPlayerData.score} steps</p>
                    {lastUpdate && <p className={styles.lastUpdate}>Last update: {lastUpdate.toLocaleTimeString("de-AT")}</p>}
                </div>
            ) : (
                <p className={styles.loading}>Loading data...</p>
            )}
        </div>
    );
}
