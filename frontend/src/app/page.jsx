'use client';
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Head from "next/head";
import VideoCall from "../components/VideoCall";
import Chat from "../components/Chat";

const Home = () => {
  const [roomId, setRoomId] = useState("");
  const [joining, setJoining] = useState(false);

  const handleCreateRoom = () => {
    const newRoomId = uuidv4();
    setRoomId(newRoomId);
    window.history.replaceState({}, "", `?room=${newRoomId}`);
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      window.history.replaceState({}, "", `?room=${roomId.trim()}`);
      setJoining(true);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <Head>
        <title>Next.js Video Call App</title>
        <meta name="description" content="A simple video calling app using Next.js, WebRTC, and Socket.IO" />
      </Head>

      <h1>Next.js Video Call App</h1>
      {!roomId || !joining ? (
        <div>
          <button onClick={handleCreateRoom} style={{ margin: "10px", padding: "10px 20px" }}>
            Create Room
          </button>
          <br />
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{ padding: "5px", marginRight: "5px" }}
          />
          <button onClick={handleJoinRoom} style={{ padding: "5px 10px" }}>Join Room</button>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "100vh" }}>
          <div style={{ flex: 1, padding: "10px", borderRight: "1px solid #ccc" }}>
            <VideoCall roomId={roomId} />
          </div>
          <div style={{ width: "300px", padding: "10px" }}>
            <Chat roomId={roomId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
