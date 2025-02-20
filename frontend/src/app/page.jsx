'use client';
import React, { useState } from "react";
import VideoCall from "@/components/VideoCall";

const HomePage = () => {
  const [roomId, setRoomId] = useState("");
  const [passcode, setPasscode] = useState("");
  const [userName, setUserName] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [inputRoomId, setInputRoomId] = useState("");
  const [inputPasscode, setInputPasscode] = useState("");
  const [inputName, setInputName] = useState("");
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const generateRoomCredentials = () => {
    const randomRoomId = Math.random().toString(36).substring(2, 10);
    const randomPasscode = Math.random().toString(36).substring(2, 8);
    setRoomId(randomRoomId);
    setPasscode(randomPasscode);
    setInputRoomId(randomRoomId);
    setInputPasscode(randomPasscode);
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (inputRoomId.trim() && inputPasscode.trim() && inputName.trim()) {
      setIsJoining(true);
      setError("");
      try {
        // The actual connection will be handled in VideoCall component
        setRoomId(inputRoomId.trim());
        setPasscode(inputPasscode.trim());
        setUserName(inputName.trim());
        setJoinedRoom(true);
      } catch (err) {
        setError(err.message || "Failed to join room. Please try again.");
      } finally {
        setIsJoining(false);
      }
    } else {
      setError("Please enter Room ID, Passcode, and Your Name");
    }
  };

  const handleLeaveRoom = () => {
    if (window.confirm("Are you sure you want to leave the room?")) {
      setJoinedRoom(false);
      setRoomId("");
      setPasscode("");
      setUserName("");
      setInputRoomId("");
      setInputPasscode("");
      setInputName("");
      setError("");
      window.location.reload();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
      {!joinedRoom ? (
        <div className="flex flex-row-reverse bg-white p-10 rounded-3xl h-96 shadow-xl max-w-md w-full text-center">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Private Video Chat Rooms</h1>
          <form onSubmit={handleJoinRoom} className="space-y-5">
            <input
              type="text"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              placeholder="Enter Room ID"
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
            />
            <input
              type="text"
              value={inputPasscode}
              onChange={(e) => setInputPasscode(e.target.value)}
              placeholder="Enter Passcode"
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
            />
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="Enter Your Name"
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-4 mt-6">
              <button 
                type="submit" 
                className="w-1/2 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-semibold"
                disabled={isJoining}
              >
                {isJoining ? 'Joining...' : 'Join Room'}
              </button>
              <button
                type="button"
                onClick={generateRoomCredentials}
                className="w-1/2 bg-gray-400 text-white py-3 rounded-xl hover:bg-gray-500 transition font-semibold"
              >
                Generate Room ID
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full text-center">
          <h1 className="text-xl font-semibold text-gray-800 mb-6">Room: {roomId} (Passcode: {passcode})</h1>
          <button onClick={handleLeaveRoom} className="bg-red-600 text-white py-3 px-6 rounded-xl hover:bg-red-700 transition font-semibold">Leave Room</button>
          <div className="mt-6">
            <VideoCall roomId={roomId} passcode={passcode} userName={userName} />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
