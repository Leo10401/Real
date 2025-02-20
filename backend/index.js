const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Add basic health check endpoint
app.get('/', (req, res) => {
  res.send('Server is running');
});

const io = new Server(server, {
  cors: {
    origin: "*",  // In production, replace with your actual frontend URL
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: false
  },
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

const activeRooms = new Map();

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("join-room", ({ roomId, userId, userName, passcode }) => {
    console.log(`Join request from ${userName} (${userId}) for room ${roomId}`);

    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, { passcode, participants: new Map() });
    }

    const room = activeRooms.get(roomId);
    
    if (room.passcode !== passcode) {
      socket.emit("join-error", "Invalid passcode");
      return;
    }

    room.participants.set(userId, userName);
    socket.join(roomId);

    socket.emit("room-users", Array.from(room.participants.entries()));
    socket.to(roomId).emit("user-connected", { userId, userName });

    console.log(`${userName} joined ${roomId}:`, Array.from(room.participants.entries()));
  });

  socket.on("signal", (data) => {
    io.to(data.to).emit("signal", { signal: data.signal, from: data.from });
  });

  socket.on("manual-disconnect", ({ roomId, userId }) => {
    if (activeRooms.has(roomId)) {
      const room = activeRooms.get(roomId);
      room.participants.delete(userId);
      if (room.participants.size === 0) activeRooms.delete(roomId);
    }
    socket.to(roomId).emit("user-disconnected", userId);
    socket.leave(roomId);
  });

  socket.on("disconnect", () => {
    for (let [roomId, room] of activeRooms.entries()) {
      if (room.participants.has(socket.id)) {
        room.participants.delete(socket.id);
        if (room.participants.size === 0) activeRooms.delete(roomId);
        socket.to(roomId).emit("user-disconnected", socket.id);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
