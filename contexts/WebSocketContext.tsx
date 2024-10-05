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
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

const WS_URL = "ws://localhost:8080/websocket"; // Replace with your WebSocket server URL
const RECONNECT_INTERVAL = 5000; // 5 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const messageQueueRef = useRef<any[]>([]);

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
      // Handle different message types here
      switch (message.type) {
        case "seek":
          // Handle seek
          break;
        case "play_pause":
          // Handle play/pause
          break;
        case "video_change":
          // Handle video change
          break;
        // Add more cases as needed
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

  return (
    <WebSocketContext.Provider
      value={{ socket, isConnected, sendMessage, lastMessage }}
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
