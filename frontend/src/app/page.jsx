'use client';
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Head from "next/head";
import VideoCall from "../components/VideoCall";
import Chat from "../components/Chat";

const HomePage = () => {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const handleCreateRoom = () => {
    if (!userName.trim()) {
      setError("Please enter your name first");
      return;
    }
    const newRoomId = uuidv4();
    setRoomId(newRoomId);
    setJoining(true);
    window.history.replaceState({}, "", `?room=${newRoomId}`);
  };

  const handleJoinRoom = () => {
    if (!userName.trim()) {
      setError("Please enter your name first");
      return;
    }
    if (!roomId.trim()) {
      setError("Please enter a room ID");
      return;
    }
    setError("");
    window.history.replaceState({}, "", `?room=${roomId.trim()}`);
    setJoining(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Head>
        <title>Next.js Video Call App</title>
        <meta name="description" content="A simple video calling app using Next.js, WebRTC, and Socket.IO" />
      </Head>

      <h1 className="text-3xl font-bold text-center mb-8">Video Chat App</h1>
      
      {!joining ? (
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-4">
            <button
              onClick={handleCreateRoom}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create New Room
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleJoinRoom}
                className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Join Room
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-4 text-red-500 text-center">{error}</p>
          )}
        </div>
      ) : (
        <div className="flex gap-4">
          <div className="flex-1">
            <VideoCall roomId={roomId} userName={userName} />
          </div>
          <div className="w-80">
            <Chat roomId={roomId} userName={userName} />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
