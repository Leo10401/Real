'use client';
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";

const SIGNALING_SERVER = process.env.NEXT_PUBLIC_SIGNALING_SERVER;

const VideoCall = ({ roomId, passcode, userName }) => {
  const [peers, setPeers] = useState([]);
  const [error, setError] = useState("");
  const userVideoRef = useRef(null);
  const peersRef = useRef([]);
  const socketRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!roomId || !passcode || !userName) return;

    const setupCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }

        socketRef.current = io(SIGNALING_SERVER);
        const userId = socketRef.current.id;
        socketRef.current.emit("join-room", { roomId, passcode, userId, userName });

        socketRef.current.on("authentication-failed", (message) => {
          setError("Authentication failed: Invalid passcode");
          socketRef.current.disconnect();
        });

        socketRef.current.on("user-connected", ({ userId: otherUserId, userName: otherUserName }) => {
          if (otherUserId === userId) return;
          console.log("User connected:", otherUserId, otherUserName);
          const peer = createPeer(otherUserId, userId, stream);
          peersRef.current.push({ peerID: otherUserId, peer, userName: otherUserName });
          setPeers((prevPeers) => [...prevPeers, { peerID: otherUserId, peer, userName: otherUserName }]);
        });

        socketRef.current.on("signal", (data) => {
          const existingPeer = peersRef.current.find(p => p.peerID === data.from);
          if (existingPeer) {
            existingPeer.peer.signal(data.signal);
          } else {
            const peer = addPeer(data.signal, data.from, stream);
            peersRef.current.push({ peerID: data.from, peer, userName: "Unknown" });
            setPeers((prevPeers) => [...prevPeers, { peerID: data.from, peer, userName: "Unknown" }]);
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
      } catch (err) {
        console.error("Failed to get media stream:", err);
      }
    };

    setupCall();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log("Stopped track:", track.kind);
        });
        streamRef.current = null;
      }

      if (userVideoRef.current) {
        userVideoRef.current.srcObject = null;
      }

      if (socketRef.current) {
        socketRef.current.emit("manual-disconnect", { roomId, userId: socketRef.current.id });
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      peersRef.current.forEach(peerObj => {
        peerObj.peer.destroy();
      });
      peersRef.current = [];
      setPeers([]);
    };
  }, [roomId, passcode, userName]);

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      if (socketRef.current) {
        socketRef.current.emit("signal", { to: userToSignal, from: callerID, signal });
      }
    });

    peer.on("error", (err) => console.error("Peer error:", err));

    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      if (socketRef.current) {
        socketRef.current.emit("signal", { to: callerID, from: socketRef.current.id, signal });
      }
    });

    peer.on("error", (err) => console.error("Peer error:", err));

    peer.signal(incomingSignal);
    return peer;
  };

  if (error) {
    return <div style={{ color: "red", textAlign: "center" }}>{error}</div>;
  }

  return (
    <div>
      <h2>Your Video</h2>
      <div style={{ textAlign: "center" }}>
        <video ref={userVideoRef} autoPlay playsInline muted style={{ width: "300px", border: "1px solid #ccc" }} />
        <div>{userName}</div>
      </div>
      <h2>Remote Videos ({peers.length} connected)</h2>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
        {peers.map((peerObj) => (
          <PeerVideo key={peerObj.peerID} peer={peerObj.peer} userName={peerObj.userName} />
        ))}
      </div>
    </div>
  );
};

const PeerVideo = ({ peer, userName }) => {
  const ref = useRef();

  useEffect(() => {
    const handleStream = (stream) => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    };

    peer.on("stream", handleStream);

    return () => {
      if (ref.current) {
        ref.current.srcObject = null;
      }
      peer.off("stream", handleStream);
    };
  }, [peer]);

  return (
    <div style={{ margin: "10px", textAlign: "center" }}>
      <video ref={ref} autoPlay playsInline style={{ width: "300px", border: "1px solid #ccc" }} />
      <div>{userName}</div>
    </div>
  );
};

export default VideoCall;