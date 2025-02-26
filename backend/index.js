// index.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const cors = require("cors");

const allowedOrigins = ["https://real-olive.vercel.app"|| '*']; // Your Vercel frontend

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true, // Allow cookies if needed
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));


const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://real-olive.vercel.app"|| '*', // Allow only your Vercel frontend
    methods: ["GET", "POST"],
    credentials: true,
  },
});


io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join a room for signaling
  socket.on("join-room", ({ roomId, userName }) => {
    socket.join(roomId);
    console.log(`User ${socket.id} (${userName}) joined room ${roomId}`);
    socket.to(roomId).emit("user-connected", { userId: socket.id, userName });
  });

  // Relay signaling data (offer, answer, ICE candidates)
  socket.on("signal", (data) => {
    // data: { to, from, signal }
    console.log(`Signal from ${data.from} to ${data.to}`);
    io.to(data.to).emit("signal", {
      signal: data.signal,
      from: data.from,
      userName: data.userName
    });
  });

  socket.on('join-chat', ({ roomId, userName }) => {
    socket.join(roomId);
    io.to(roomId).emit('chat-message', {
      userName: 'System',
      text: `${userName} has joined the chat`,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('send-message', (messageData) => {
    io.to(messageData.roomId).emit('chat-message', messageData);
  });

  socket.on("leave-room", ({ roomId, userName }) => {
    socket.leave(roomId);
    io.to(roomId).emit('chat-message', {
      userName: 'System',
      text: `${userName} has left the room`,
      timestamp: new Date().toISOString()
    });
    io.to(roomId).emit("user-disconnected", socket.id);
    console.log(`User ${userName} left room ${roomId}`);
  });

  const handleDisconnect = () => {
    const rooms = Array.from(socket.rooms);
    rooms.forEach(roomId => {
      if (roomId !== socket.id) {
        socket.to(roomId).emit("user-disconnected", socket.id);
        socket.leave(roomId);
      }
    });
    console.log("Client disconnected:", socket.id);
  };

  socket.on("disconnect", handleDisconnect);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () =>
  console.log(`Signaling server listening on port ${PORT}`)
);