"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");

  const joinRoom = () => {
    if (roomId.trim()) {
      router.push(`/call/${roomId}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-4">Join a Video Call Room</h1>
      <input
        className="p-2 mb-4 rounded bg-gray-700 text-white border-none focus:outline-none focus:ring focus:border-blue-300"
        type="text"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button
        onClick={joinRoom}
        className="p-2 bg-blue-600 rounded hover:bg-blue-500"
      >
        Join Room
      </button>
    </div>
  );
}
