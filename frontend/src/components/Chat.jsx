'use client';
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SIGNALING_SERVER = process.env.NEXT_PUBLIC_SIGNALING_SERVER;

const Chat = ({ roomId, userName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef();
  const messagesEndRef = useRef();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    socketRef.current = io(SIGNALING_SERVER);
    
    socketRef.current.emit('join-chat', { roomId, userName });

    socketRef.current.on('chat-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId, userName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const messageData = {
        roomId,
        userName,
        text: newMessage,
        timestamp: new Date().toISOString()
      };
      socketRef.current.emit('send-message', messageData);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-80 bg-white rounded-lg shadow-md">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Chat Room</h2>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className="mb-4">
            <div className="font-semibold text-sm text-gray-600">
              {msg.userName}
            </div>
            <div className="bg-gray-100 rounded-lg p-2 mt-1">
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
