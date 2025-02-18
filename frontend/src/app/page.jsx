import React from "react";
import Head from "next/head";
import VideoCall from "../components/VideoCall";

const SIGNALING_SERVER = process.env.NEXT_PUBLIC_SIGNALING_SERVER;
const ROOM_ID = process.env.NEXT_PUBLIC_ROOM_ID;

const Home = () => {
  return (
    <div>
      <Head>
        <title>Next.js Video Call App</title>
        <meta
          name="description"
          content="A simple video calling app using Next.js, WebRTC, and Socket.IO"
        />
      </Head>
      <main style={{ padding: "20px", textAlign: "center" }}>
        <h1>Next.js Video Call App</h1>

        {!SIGNALING_SERVER || !ROOM_ID ? (
          <p style={{ color: "red", fontWeight: "bold" }}>
            Missing environment variables! Ensure NEXT_PUBLIC_SIGNALING_SERVER and NEXT_PUBLIC_ROOM_ID are set.
          </p>
        ) : (
          <VideoCall />
        )}
      </main>
    </div>
  );
};

export default Home;
