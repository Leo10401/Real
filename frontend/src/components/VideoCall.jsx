'use client';
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";

const SIGNALING_SERVER = process.env.NEXT_PUBLIC_SIGNALING_SERVER;

const VideoCall = ({ roomId }) => {
  const [peers, setPeers] = useState([]);
  const userVideoRef = useRef(null);
  const peersRef = useRef([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }

        socketRef.current = io(SIGNALING_SERVER);
        socketRef.current.emit("join-room", roomId);

        socketRef.current.on("user-connected", (userId) => {
          console.log("User connected:", userId);
          const peer = createPeer(userId, socketRef.current.id, stream);
          peersRef.current.push({ peerID: userId, peer });
          setPeers((prevPeers) => [...prevPeers, { peerID: userId, peer }]);
        });

        socketRef.current.on("signal", (data) => {
          const existingPeer = peersRef.current.find(p => p.peerID === data.from);
          if (existingPeer) {
            existingPeer.peer.signal(data.signal);
          } else {
            const peer = addPeer(data.signal, data.from, stream);
            peersRef.current.push({ peerID: data.from, peer });
            setPeers((prevPeers) => [...prevPeers, { peerID: data.from, peer }]);
          }
        });

        socketRef.current.on("user-disconnected", (userId) => {
          console.log("User disconnected:", userId);
          const peerObj = peersRef.current.find(p => p.peerID === userId);
          if (peerObj) {
            peerObj.peer.destroy();
          }
          peersRef.current = peersRef.current.filter(p => p.peerID !== userId);
          setPeers((prevPeers) => prevPeers.filter(p => p.peerID !== userId));
        });
      })
      .catch((err) => console.error("Failed to get media stream:", err));

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

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

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("signal", { to: callerID, from: socketRef.current.id, signal });
    });

    peer.signal(incomingSignal);
    return peer;
  };

  return (
    <div>
      <h2>Your Video</h2>
      <video ref={userVideoRef} autoPlay playsInline muted style={{ width: "300px", border: "1px solid #ccc" }} />
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

  return <video ref={ref} autoPlay playsInline style={{ width: "300px", margin: "10px", border: "1px solid #ccc" }} />;
};

export default VideoCall;
