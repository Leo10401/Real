const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require("cors");
const app = express();

const allowedOrigins = ["https://real-olive.vercel.app"|| '*']; // Your Vercel frontend

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true, // Allow cookies if needed
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://real-olive.vercel.app"|| '*', // Allow only your Vercel frontend
    methods: ["GET", "POST"],
    credentials: true,
  }
});

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, userId, userName }) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', { userId, userName });
    console.log(`User ${userName} (${userId}) joined room ${roomId}`);
  });

  socket.on('signal', (data) => {
    io.to(data.to).emit('signal', {
      signal: data.signal,
      from: data.from
    });
  });

  socket.on('manual-disconnect', ({ roomId, userId }) => {
    socket.to(roomId).emit('user-disconnected', userId);
    socket.leave(roomId);
  });

  socket.on('disconnect', () => {
    const rooms = Object.keys(socket.rooms);
    rooms.forEach(room => {
      if (room !== socket.id) {
        socket.to(room).emit('user-disconnected', socket.id);
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});