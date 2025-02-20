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
  const userIdRef = useRef(null);

  const getUserId = () => {
    let userId = localStorage.getItem('videoCallUserId');
    if (!userId) {
      userId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('videoCallUserId', userId);
    }
    return userId;
  };

  useEffect(() => {
    if (!roomId) return;

    const userId = getUserId();
    userIdRef.current = userId;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }

        socketRef.current = io(SIGNALING_SERVER, {
          query: { userId }
        });

        socketRef.current.emit("join-room", { roomId, userId });

        socketRef.current.on("user-connected", (otherUserId) => {
          if (otherUserId === userId) return;
          console.log("User connected:", otherUserId);
          const peer = createPeer(otherUserId, userId, stream);
          peersRef.current.push({ peerID: otherUserId, peer });
          setPeers((prevPeers) => [...prevPeers, { peerID: otherUserId, peer }]);
        });

        socketRef.current.on("signal", (data) => {
          if (data.from === userId) return;
          const existingPeer = peersRef.current.find(p => p.peerID === data.from);
          if (existingPeer) {
            existingPeer.peer.signal(data.signal);
          } else {
            const peer = addPeer(data.signal, data.from, stream);
            peersRef.current.push({ peerID: data.from, peer });
            setPeers((prevPeers) => [...prevPeers, { peerID: data.from, peer }]);
          }
        });

        socketRef.current.on("user-disconnected", (disconnectedUserId) => {
          if (disconnectedUserId === userId) return;
          console.log("User disconnected:", disconnectedUserId);
          const peerObj = peersRef.current.find(p => p.peerID === disconnectedUserId);
          if (peerObj) {
            peerObj.peer.destroy();
          }
          peersRef.current = peersRef.current.filter(p => p.peerID !== disconnectedUserId);
          setPeers((prevPeers) => prevPeers.filter(p => p.peerID !== disconnectedUserId));
        });

        const handleBeforeUnload = () => {
          socketRef.current.emit("manual-disconnect", { roomId, userId });
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
          window.removeEventListener("beforeunload", handleBeforeUnload);
          if (socketRef.current) {
            socketRef.current.emit("manual-disconnect", { roomId, userId });
            socketRef.current.disconnect();
            stream.getTracks().forEach(track => track.stop());
          }
          peersRef.current.forEach(peerObj => peerObj.peer.destroy());
        };
      })
      .catch((err) => console.error("Failed to get media stream:", err));
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
      socketRef.current.emit("signal", { to: callerID, from: userIdRef.current, signal });
    });

    peer.on("error", (err) => console.error("Peer error:", err));

    peer.signal(incomingSignal);
    return peer;
  };

  return (
    <div>
      <h2>Your Video (ID: {userIdRef.current})</h2>
      <video ref={userVideoRef} autoPlay playsInline muted style={{ width: "300px", border: "1px solid #ccc" }} />
      <h2>Remote Videos ({peers.length} connected)</h2>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
        {peers.map((peerObj) => (
          <PeerVideo key={peerObj.peerID} peer={peerObj.peer} peerId={peerObj.peerID} />
        ))}
      </div>
    </div>
  );
};

const PeerVideo = ({ peer, peerId }) => {
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
      <div>ID: {peerId}</div>
    </div>
  );
};

export default VideoCall;