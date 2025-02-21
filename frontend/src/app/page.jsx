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
  const [isChatOpen, setIsChatOpen] = useState(false);

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

  const handleLeaveRoom = () => {
    if (window.confirm('Are you sure you want to leave the room?')) {
      setJoining(false);
      setRoomId("");
      setUserName("");
      setIsChatOpen(false);
      window.history.replaceState({}, "", "/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4">
      <Head>
        <title>Next.js Video Call App</title>
        <meta name="description" content="A simple video calling app using Next.js, WebRTC, and Socket.IO" />
      </Head>

      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-8">Video Chat App</h1>
      
      {!joining ? (
        <div className="max-w-md mx-auto bg-white p-4 sm:p-8 rounded-lg shadow-md">
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
        <div className="flex flex-col md:flex-row gap-4 relative">
          <div className="w-full md:flex-1">
          <div className="w-full flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Room: {roomId}</h2>
            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Leave Room
            </button>
          </div>
            <VideoCall roomId={roomId} userName={userName} />
          </div>
          
          {/* Chat Toggle Button - Only visible on mobile */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="fixed bottom-4 right-4 z-50 md:hidden bg-blue-500 text-white p-3 rounded-full shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>

          {/* Desktop Chat */}
          <div className="hidden md:block w-80">
            <Chat roomId={roomId} userName={userName} />
          </div>

          {/* Mobile Chat Modal */}
          {isChatOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsChatOpen(false)} />
              <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl max-h-[80vh]">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Chat</h2>
                  <button onClick={() => setIsChatOpen(false)} className="text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <Chat roomId={roomId} userName={userName} isMobile={true} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
