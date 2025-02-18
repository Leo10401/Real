// components/VideoCall.jsx
'use client';
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";

const SIGNALING_SERVER = "http://localhost:5000"; // URL of your backend signaling server
const ROOM_ID = "video-room"; // This can be dynamic for different rooms

const VideoCall = () => {
  const [peers, setPeers] = useState([]);
  const userVideoRef = useRef(null);
  const peersRef = useRef([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // Get the user's video/audio stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }

        // Connect to the signaling server via Socket.IO
        socketRef.current = io(SIGNALING_SERVER);
        socketRef.current.emit("join-room", ROOM_ID);

        // When a new user connects, initiate a peer connection
        socketRef.current.on("user-connected", (userId) => {
          console.log("User connected:", userId);
          const peer = createPeer(userId, socketRef.current.id, stream);
          peersRef.current.push({ peerID: userId, peer });
          setPeers((prevPeers) => [...prevPeers, { peerID: userId, peer }]);
        });

        // Listen for incoming signaling data
        socketRef.current.on("signal", (data) => {
          const existingPeer = peersRef.current.find(p => p.peerID === data.from);
          if (existingPeer) {
            existingPeer.peer.signal(data.signal);
          } else {
            // If a signal comes from a new user, add a peer connection in answering mode
            const peer = addPeer(data.signal, data.from, stream);
            peersRef.current.push({ peerID: data.from, peer });
            setPeers((prevPeers) => [...prevPeers, { peerID: data.from, peer }]);
          }
        });
      })
      .catch((err) => console.error("Failed to get media stream:", err));

    // Cleanup on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Function to create a peer (caller)
  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("signal", { to: userToSignal, from: callerID, signal });
    });

    return peer;
  };

  // Function to add a peer (answerer)
  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("signal", { to: callerID, from: socketRef.current.id, signal });
    });

    // Complete the handshake with the incoming signal
    peer.signal(incomingSignal);
    return peer;
  };

  return (
    <div>
      <h2>Your Video</h2>
      <video
        ref={userVideoRef}
        autoPlay
        playsInline
        muted
        style={{ width: "300px", border: "1px solid #ccc" }}
      />
      <h2>Remote Videos</h2>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
        {peers.map((peerObj) => (
          <PeerVideo key={peerObj.peerID} peer={peerObj.peer} />
        ))}
      </div>
    </div>
  );
};

const PeerVideo = ({ peer }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on("stream", (stream) => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    });
  }, [peer]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      style={{ width: "300px", margin: "10px", border: "1px solid #ccc" }}
    />
  );
};

export default VideoCall;
