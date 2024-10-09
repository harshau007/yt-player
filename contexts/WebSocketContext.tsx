"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: any) => void;
  lastMessage: any;
  currentTime: number;
  isPlaying: boolean;
  videoId: string;
  latency: number;
  sendPing: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

const WS_URL = "ws://localhost:8080/websocket"; // Replace with your WebSocket server URL
const RECONNECT_INTERVAL = 5000; // 5 seconds
const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_SYNC_INTERVAL = 250; // Initial sync interval
const MIN_SYNC_INTERVAL = 100; // Minimum sync interval
const MAX_SYNC_INTERVAL = 500; // Maximum sync interval
const LATENCY_ALPHA = 0.2; // EMA alpha value for latency smoothing

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const messageQueueRef = useRef<any[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoId, setVideoId] = useState("");
  const [latency, setLatency] = useState(0);
  const lastPingTimeRef = useRef<number>(0);
  const syncIntervalRef = useRef<number>(INITIAL_SYNC_INTERVAL);

  const connect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      toast.error(
        "Max reconnection attempts reached. Please refresh the page.",
        {
          richColors: true,
          duration: 5000,
        }
      );
      return;
    }

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      toast.success("WebSocket connection established.", {
        richColors: true,
      });
      // Send any queued messages
      while (messageQueueRef.current.length > 0) {
        const message = messageQueueRef.current.shift();
        ws.send(JSON.stringify(message));
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      toast.error("WebSocket connection lost. Attempting to reconnect...", {
        richColors: true,
      });
      reconnectAttemptsRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_INTERVAL);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast.error("WebSocket encountered an error.", {
        richColors: true,
      });
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setLastMessage(message);

      switch (message.type) {
        case "seek":
          setCurrentTime(message.time);
          break;
        case "play_pause":
          setIsPlaying(message.isPlaying);
          break;
        case "video_change":
          setVideoId(message.videoId);
          setCurrentTime(0); // Reset current time when video changes
          break;
        case "sync_response":
          if (message.videoId) {
            setVideoId(message.videoId);
          }
          if (message.time !== undefined) {
            setCurrentTime(message.time);
          }
          if (message.isPlaying !== undefined) {
            setIsPlaying(message.isPlaying);
          }
          break;
        case "pong":
          const rtt = Date.now() - lastPingTimeRef.current;
          const newLatency = rtt / 2; // Assuming symmetric latency
          setLatency(
            (prevLatency) =>
              prevLatency * (1 - LATENCY_ALPHA) + newLatency * LATENCY_ALPHA
          );
          break;
        case "room_state":
          setVideoId(message.videoId);
          setCurrentTime(message.currentTime);
          setIsPlaying(message.isPlaying);
          break;
        default:
          console.warn("Unhandled message type:", message.type);
      }
    };

    setSocket(ws);

    return () => {
      ws.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  const sendMessage = useCallback(
    (message: any) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else if (socket?.readyState === WebSocket.CONNECTING) {
        messageQueueRef.current.push(message);
      } else {
        console.warn("Attempted to send message while disconnected");
        toast.warning(
          "Attempted to send message while disconnected. Message queued.",
          {
            richColors: true,
          }
        );
        messageQueueRef.current.push(message);
      }
    },
    [socket]
  );

  const sendPing = useCallback(() => {
    lastPingTimeRef.current = Date.now();
    sendMessage({ type: "ping" });
  }, [sendMessage]);

  // Adjust sync interval based on latency
  useEffect(() => {
    const newSyncInterval = Math.max(
      MIN_SYNC_INTERVAL,
      Math.min(MAX_SYNC_INTERVAL, latency * 4)
    );
    syncIntervalRef.current = newSyncInterval;
  }, [latency]);

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        sendMessage,
        lastMessage,
        currentTime,
        isPlaying,
        videoId,
        latency,
        sendPing,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
