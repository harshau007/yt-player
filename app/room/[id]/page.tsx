"use client";

import Player from "@/components/room-player";
import Search from "@/components/room-search";
import SearchResults from "@/components/room-search-result";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { LogOut } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Room() {
  const { id } = useParams();
  const {
    socket,
    isConnected,
    sendMessage,
    videoId: contextVideoId,
    isPlaying,
    currentTime,
  } = useWebSocket();
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [localVideoId, setLocalVideoId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = () => {
      const admin = localStorage.getItem(`room_${id}_admin`) === "true";
      setIsAdmin(admin);
      return admin;
    };

    const isAdminUser = checkAdminStatus();
    const storedVideoId = localStorage.getItem(`room_${id}_videoId`);
    setLocalVideoId(storedVideoId as string);
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
    if (contextVideoId) {
      setLocalVideoId(contextVideoId);
      localStorage.setItem(`room_${id}_videoId`, contextVideoId);
    }
  }, [contextVideoId, id]);

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
      setLocalVideoId(selectedVideoId);
      localStorage.setItem(`room_${id}_videoId`, selectedVideoId);
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-4">Room: {id}</h1>
        <Button
          onClick={() => router.replace("/room/join")}
          variant="outline"
          size="sm"
        >
          <LogOut className="mr-2 h-4 w-4" /> Leave Room
        </Button>
      </div>
      <p className="mb-4">
        You are {isAdmin ? "the admin" : "a participant"} in this room.
      </p>
      <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
        <div className="w-full lg:w-2/3">
          {localVideoId ? (
            <Player
              initialVideoId={localVideoId}
              onSeek={handleSeek}
              onPlayPause={handlePlayPause}
              isAdmin={isAdmin}
              roomId={id as string}
              initialIsPlaying={isPlaying}
              initialCurrentTime={currentTime}
            />
          ) : (
            <div className="bg-secondary p-4 rounded-md">
              <p>Waiting for the admin to select a video...</p>
            </div>
          )}
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
    </div>
  );
}
