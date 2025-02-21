'use client';
import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const SIGNALING_SERVER = process.env.NEXT_PUBLIC_SIGNALING_SERVER;

const Chat = ({ roomId }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    socketRef.current = io(SIGNALING_SERVER);
    socketRef.current.emit("join-room", roomId);

    socketRef.current.on("chat-message", (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

  const sendMessage = () => {
    if (message.trim() && socketRef.current) {
      const msgData = { text: message, sender: "You", roomId };
      socketRef.current.emit("chat-message", msgData);
      setMessages((prevMessages) => [...prevMessages, msgData]);
      setMessage("");
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "10px", marginTop: "10px" }}>
      <h3>Chat</h3>
      <div style={{ height: "200px", overflowY: "auto", border: "1px solid #ddd", padding: "5px" }}>
        {messages.map((msg, index) => (
          <p key={index}><strong>{msg.sender}:</strong> {msg.text}</p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        style={{ width: "80%", padding: "5px" }}
      />
      <button onClick={sendMessage} style={{ padding: "5px 10px", marginLeft: "5px" }}>Send</button>
    </div>
  );
};

export default Chat;
