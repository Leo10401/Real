'use client';
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";

const SIGNALING_SERVER = process.env.NEXT_PUBLIC_SIGNALING_SERVER;

const VideoCall = ({ roomId, passcode, userName }) => {
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

        // Updated socket connection configuration
        socketRef.current = io(SIGNALING_SERVER, {
          transports: ['polling', 'websocket'],
          withCredentials: false, // Changed to false
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          query: { userId, roomId, userName }
        });

        socketRef.current.emit("join-room", { roomId, userId });

        socketRef.current.on("user-connected", ({ userId: otherUserId, userName: otherUserName }) => {
          if (otherUserId === userId) return;
          console.log("User connected:", otherUserId, otherUserName);
          const peer = createPeer(otherUserId, userId, stream);
          peersRef.current.push({
            peerID: otherUserId,
            userName: otherUserName,
            peer
          });
          setPeers(prevPeers => [...prevPeers, {
            peerID: otherUserId,
            userName: otherUserName,
            peer
          }]);
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <div className="relative">
        <video
          ref={userVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full border rounded-lg shadow-md"
        />
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
          {userName} (You)
        </div>
      </div>
      {peers.map(({ peerID, userName: peerName, peer }) => (
        <PeerVideo 
          key={peerID} 
          peer={peer} 
          userName={peerName || 'Anonymous'} 
        />
      ))}
    </div>
  );
};

const PeerVideo = ({ peer, userName }) => {
  const videoRef = useRef();

  useEffect(() => {
    peer.on("stream", stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [peer]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full border rounded-lg shadow-md"
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
        {userName}
      </div>
    </div>
  );
};

export default VideoCall;