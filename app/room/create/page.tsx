"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function CreateRoom() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const handleCreateRoom = () => {
    const newRoomId = roomId || uuidv4();
    localStorage.setItem(`room_${newRoomId}_admin`, "true");
    router.push(`/room/${newRoomId}`);
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
        <Button onClick={handleCreateRoom}>Create Room</Button>
      </div>
    </div>
  );
}
