// pages/index.jsx
import React from "react";
import Head from "next/head";
import VideoCall from "@/components/VideoCall";


const Home = () => {
  return (
    <div>
      <Head>
        <title>Next.js Video Call App</title>
        <meta name="description" content="A simple video calling app using Next.js, WebRTC, and Socket.IO" />
      </Head>
      <main style={{ padding: "20px", textAlign: "center" }}>
        <h1>Next.js Video Call zApp</h1>
        <VideoCall />
      </main>
    </div>
  );
};

export default Home;
