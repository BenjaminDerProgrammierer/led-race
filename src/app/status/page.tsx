'use client';
import { useState, useEffect, useRef } from "react";

import { CurrentDataResponse } from "@/app/api/get-current-data/route";

import styles from './page.module.css';
import SyntaxHighlighter from "react-syntax-highlighter/dist/cjs/prism";
import { twilight } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function StatusPage() {
  const [data, setData] = useState("");
  const [liveData, setLiveData] = useState("");
  const [lastLiveUpdate, setLastLiveUpdate] = useState(null as Date | null);
  const [lastUpdate, setLastUpdate] = useState(null as Date | null);

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
            const parsed = JSON.parse(ev.data);
            setLiveData(JSON.stringify(parsed, null, 2));
            setLastLiveUpdate(new Date());
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
          const backoff = Math.min(30000, 1000 * Math.pow(2, reconnectRef.current));
          reconnectRef.current += 1;
          setTimeout(() => connect(), backoff);
        };
      } catch {
        const backoff = Math.min(30000, 1000 * Math.pow(2, reconnectRef.current));
        reconnectRef.current += 1;
        setTimeout(() => connect(), backoff);
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

  async function fetchData() {
    const res = await fetch("/api/get-current-data");
    const data = await res.json() as CurrentDataResponse;
    if (data?.success) {
      setData(JSON.stringify(data.result, null, 2));
    } else {
      setData(`Error: ${data?.error ?? "Unknown error"}`);
    }
    setLastUpdate(new Date());
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>MQTT Data Client</h1>
      <div className={styles.section}>
        <h2 className={styles.subtitle}>Data</h2>
        <button onClick={fetchData} className="button">Fetch Data</button>
        {data && (
          <>
            <div className={styles.timestamp}>{lastUpdate?.toLocaleTimeString("de-AT")}</div>
            <SyntaxHighlighter language="json" className={styles.data} showLineNumbers={true} style={twilight}>
              {data}
            </SyntaxHighlighter>
          </>
        )}
      </div>
      <div className={styles.section}>
        <h2 className={styles.subtitle}>Live Data</h2>
        <div className={styles.timestamp}>{lastLiveUpdate?.toLocaleTimeString("de-AT")}</div>
        <SyntaxHighlighter language="json" className={styles.data} showLineNumbers={true} style={twilight}>
          {liveData}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
