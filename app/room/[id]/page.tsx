"use client";

import Player from "@/components/room-player";
import Search from "@/components/room-search";
import SearchResults from "@/components/room-search-result";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Room() {
  const { id } = useParams();
  const { socket, isConnected, sendMessage } = useWebSocket();
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ"); // Default video
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(0);

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
    if (socket) {
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case "seek":
            setCurrentTime(message.time);
            break;
          case "video_change":
            setVideoId(message.videoId);
            setCurrentTime(0);
            break;
          // Add more cases as needed
        }
      };
    }
  }, [socket]);

  const handleSeek = (time: number) => {
    setCurrentTime(time);
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
    setVideoId(selectedVideoId);
    setCurrentTime(0);
    if (isAdmin) {
      sendMessage({
        type: "video_change",
        roomId: id,
        videoId: selectedVideoId,
      });
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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
      {isAdmin ? (
        <>
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="w-full lg:w-2/3">
              <Player
                videoId={videoId}
                onSeek={handleSeek}
                onPlayPause={handlePlayPause}
                isAdmin={isAdmin}
                roomId={id as string}
                // currentTime={currentTime}
              />
            </div>
            <div className="w-full lg:w-1/3 h-full">
              <div className="mb-4">
                <Search onSearch={handleSearch} isAdmin={isAdmin} />
              </div>
              <div className="h-[calc(100vh-90px)] overflow-y-auto">
                <SearchResults
                  query={searchQuery}
                  onVideoSelect={handleVideoSelect}
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <Player
            videoId={videoId}
            onSeek={handleSeek}
            onPlayPause={handlePlayPause}
            isAdmin={isAdmin}
            roomId={id as string}
          />
        </>
      )}
    </div>
  );
}
