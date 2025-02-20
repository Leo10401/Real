'use client';
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Head from "next/head";
import VideoCall from "../components/VideoCall";

const SIGNALING_SERVER = process.env.NEXT_PUBLIC_SIGNALING_SERVER;

const Home = () => {
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    // Generate a random room ID only if not already present in URL
    const urlParams = new URLSearchParams(window.location.search);
    let existingRoomId = urlParams.get("room");

    if (!existingRoomId) {
      existingRoomId = uuidv4(); // Generate new room ID
      urlParams.set("room", existingRoomId);
      window.history.replaceState({}, "", `?room=${existingRoomId}`);
    }

    setRoomId(existingRoomId);
  }, []);

  return (
    <div>
      <Head>
        <title>Next.js Video Call App</title>
        <meta name="description" content="A simple video calling app using Next.js, WebRTC, and Socket.IO" />
      </Head>

      <main style={{ padding: "20px", textAlign: "center" }}>
        <h1>Next.js Video Call App</h1>

        {!SIGNALING_SERVER ? (
          <p style={{ color: "red", fontWeight: "bold" }}>Missing environment variable: NEXT_PUBLIC_SIGNALING_SERVER</p>
        ) : (
          <VideoCall roomId={roomId} />
        )}
z
        <p>Room ID: <strong>{roomId}</strong></p>
      </main>
    </div>
  );
};

export default Home;
