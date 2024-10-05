"use client";

import Player from "@/components/room-player";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Room() {
  const { id } = useParams();
  const { socket, isConnected, sendMessage } = useWebSocket();
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ"); // Default video
  const [showSearchResults, setShowSearchResults] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q");

  useEffect(() => {
    const checkAdminStatus = () => {
      const isAdminUser = localStorage.getItem(`room_${id}_admin`) === "true";
      setIsAdmin(isAdminUser);
      return isAdminUser;
    };

    const isAdminUser = checkAdminStatus();

    if (isConnected) {
      sendMessage({ type: "join_room", roomId: id, isAdmin: isAdminUser });
      if (!isAdminUser) {
        sendMessage({ type: "sync_request", roomId: id });
      }
    }

    return () => {
      if (isConnected) {
        sendMessage({ type: "leave_room", roomId: id });
      }
    };
  }, [id, isConnected, sendMessage]);

  useEffect(() => {
    if (searchQuery) {
      setShowSearchResults(true);
    }
  }, [searchQuery]);

  const handleSeek = (time: number) => {
    if (isAdmin) {
      sendMessage({ type: "seek", roomId: id, time });
    }
  };

  const handlePlayPause = (isPlaying: boolean) => {
    if (isAdmin) {
      sendMessage({ type: "play_pause", roomId: id, isPlaying });
    }
  };

  const handleVideoSelect = (selectedVideoId: string) => {
    if (isAdmin) {
      setVideoId(selectedVideoId);
      sendMessage({
        type: "video_change",
        roomId: id,
        videoId: selectedVideoId,
      });
      setShowSearchResults(false);
      router.push(`/room/${id}`);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Room: {id}</h1>
      <p className="mb-4">
        You are {isAdmin ? "the admin" : "a participant"} in this room.
      </p>
      {/* {isAdmin && (
        <div className="mb-4">
          <Search />
        </div>
      )}
      {showSearchResults && isAdmin && searchQuery && (
        <div className="mb-4">
          <SearchResults
            query={searchQuery}
            onVideoSelect={handleVideoSelect}
          />
        </div>
      )} */}
      <Player
        videoId={videoId}
        onSeek={handleSeek}
        onPlayPause={handlePlayPause}
        isAdmin={isAdmin}
        roomId={id as string}
      />
    </div>
  );
}
