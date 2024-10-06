"use client";

import Search from "@/components/room-search";
import SearchResults from "@/components/room-search-result";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function CreateRoom() {
  const [roomId, setRoomId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [selectedVideoTitle, setSelectedVideoTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { sendMessage } = useWebSocket();

  const handleCreateRoom = () => {
    if (!selectedVideoId) {
      setError("Please select a default video before creating the room.");
      return;
    }

    const newRoomId = roomId || uuidv4();

    // Set local storage
    localStorage.setItem(`room_${newRoomId}_admin`, "true");
    localStorage.setItem(`room_${newRoomId}_videoId`, selectedVideoId);

    // Send create room message to server
    sendMessage({
      type: "create_room",
      roomId: newRoomId,
      videoId: selectedVideoId,
    });

    // Navigate to the new room
    router.push(`/room/${newRoomId}`);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleVideoSelect = (videoId: string, videoTitle: string) => {
    setSelectedVideoId(videoId);
    setSelectedVideoTitle(videoTitle);
    setError(null);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create a Room</h1>
      <div className="flex flex-col space-y-4">
        <Input
          type="text"
          placeholder="Enter room ID (optional)"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <div className="border p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Select Default Video</h2>
          <Search onSearch={handleSearch} isAdmin={true} />
          <div className="h-64 overflow-y-auto mt-4">
            <SearchResults
              query={searchQuery}
              onVideoSelect={handleVideoSelect}
            />
          </div>
        </div>
        {selectedVideoId && (
          <div className="bg-secondary p-4 rounded-md">
            <h3 className="font-semibold">Selected Video:</h3>
            <p className="truncate">{selectedVideoTitle}</p>
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button onClick={handleCreateRoom}>Create Room</Button>
      </div>
    </div>
  );
}
