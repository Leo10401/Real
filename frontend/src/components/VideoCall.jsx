"use client";
import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";

const socket = io(process.env.NEXT_PUBLIC_SIGNALING_SERVER);

const VideoCall = ({ roomId, passcode, userName }) => {
  const [peers, setPeers] = useState([]);
  const userId = useRef(socket.id);
  const videoRef = useRef();
  const peersRef = useRef([]);
  const streamRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      socket.emit("join-room", { roomId, userId: userId.current, userName, passcode });

      socket.on("room-users", (users) => {
        users.forEach(([peerId, peerName]) => {
          if (peerId !== userId.current) {
            const peer = createPeer(peerId, false);
            peersRef.current.push({ peerID: peerId, peer, userName: peerName });
            setPeers((prev) => [...prev, { peerID: peerId, peer, userName: peerName }]);
          }
        });
      });

      socket.on("user-connected", ({ userId: newUserId, userName }) => {
        if (newUserId !== userId.current) {
          const peer = createPeer(newUserId, true);
          peersRef.current.push({ peerID: newUserId, peer, userName });
          setPeers((prev) => [...prev, { peerID: newUserId, peer, userName }]);
        }
      });

      socket.on("signal", ({ signal, from }) => {
        const existingPeer = peersRef.current.find((p) => p.peerID === from);
        if (existingPeer) {
          try {
            existingPeer.peer.signal(signal);
          } catch (err) {
            console.error("Error processing signal:", err);
          }
        }
      });

      socket.on("user-disconnected", (peerID) => {
        const peerObj = peersRef.current.find((p) => p.peerID === peerID);
        if (peerObj) {
          peerObj.peer.destroy();
        }
        peersRef.current = peersRef.current.filter((p) => p.peerID !== peerID);
        setPeers((prev) => prev.filter((p) => p.peerID !== peerID));
      });
    });

    return () => {
      socket.emit("manual-disconnect", { roomId, userId: userId.current });
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const createPeer = (peerID, initiator) => {
    const peer = new SimplePeer({ initiator, trickle: false, stream: streamRef.current });

    peer.on("signal", (signal) => {
      socket.emit("signal", { to: peerID, from: userId.current, signal });
    });

    peer.on("error", (err) => {
      console.error("Peer error:", err);
    });

    return peer;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <video ref={videoRef} autoPlay playsInline muted className="w-1/3 border rounded-md" />
      <h2 className="mt-4 text-lg font-bold">Participants:</h2>
      <div className="flex gap-4 mt-2">
        {peers.map(({ peerID, userName }) => (
          <div key={peerID} className="p-2 bg-gray-200 rounded-md">
            {userName}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoCall;
