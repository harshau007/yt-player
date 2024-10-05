"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function JoinRoom() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const handleJoinRoom = () => {
    if (roomId) {
      router.push(`/room/${roomId}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Join a Room</h1>
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Enter room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <Button onClick={handleJoinRoom}>Join Room</Button>
      </div>
    </div>
  );
}
