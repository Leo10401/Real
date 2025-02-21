'use client';
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";

const SIGNALING_SERVER = process.env.NEXT_PUBLIC_SIGNALING_SERVER;

const VideoCall = ({ roomId, userName }) => {
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
        socketRef.current.emit("join-room", { roomId, userName });

        socketRef.current.on("user-connected", ({ userId, userName }) => {
          console.log("User connected:", userId, userName);
          const peer = createPeer(userId, socketRef.current.id, stream);
          peersRef.current.push({ peerID: userId, peer, userName });
          setPeers((prevPeers) => [...prevPeers, { peerID: userId, peer, userName }]);
        });

        socketRef.current.on("signal", (data) => {
          const existingPeer = peersRef.current.find(p => p.peerID === data.from);
          if (existingPeer) {
            existingPeer.peer.signal(data.signal);
          } else {
            const peer = addPeer(data.signal, data.from, stream);
            peersRef.current.push({ peerID: data.from, peer, userName: data.userName });
            setPeers((prevPeers) => [...prevPeers, { peerID: data.from, peer, userName: data.userName }]);
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
  }, [roomId, userName]);

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("signal", { to: userToSignal, from: callerID, signal, userName });
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
      socketRef.current.emit("signal", { to: callerID, from: socketRef.current.id, signal, userName });
    });

    peer.signal(incomingSignal);
    return peer;
  };

  return (
    <div className="p-2">
      <h2 className="text-xl font-semibold mb-2">Your Video</h2>
      <div className="relative w-full">
        <video 
          ref={userVideoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full max-w-[600px] mx-auto rounded-lg border border-gray-300 shadow-md"
        />
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {userName} (You)
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-4 mb-2">Remote Videos ({peers.length})</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {peers.map((peerObj) => (
          <PeerVideo 
            key={peerObj.peerID} 
            peer={peerObj.peer} 
            userName={peerObj.userName}
          />
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
    <div className="relative w-full">
      <video 
        ref={ref} 
        autoPlay 
        playsInline 
        className="w-full rounded-lg border border-gray-300 shadow-md"
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        {userName}
      </div>
    </div>
  );
};

export default VideoCall;
