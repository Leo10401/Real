const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://real-olive.vercel.app" || '*',
    methods: ["GET", "POST"],
  }
});

// Track active rooms and their participants
const activeRooms = new Map();

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, userId, userName, passcode }) => {
    // Initialize room if it doesn't exist
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, {
        passcode,
        participants: new Map()
      });
    }

    const room = activeRooms.get(roomId);
    
    // Validate passcode
    if (room.passcode !== passcode) {
      socket.emit('join-error', 'Invalid passcode');
      return;
    }

    // Add participant to room
    room.participants.set(userId, userName);
    socket.join(roomId);

    // Notify others in the room
    socket.to(roomId).emit('user-connected', { userId, userName });
    
    // Send current participants list to the joining user
    socket.emit('room-users', Array.from(room.participants.entries()));
    
    console.log(`User ${userName} (${userId}) joined room ${roomId}`);
  });

  socket.on('signal', (data) => {
    io.to(data.to).emit('signal', {
      signal: data.signal,
      from: data.from
    });
  });

  socket.on('manual-disconnect', ({ roomId, userId }) => {
    if (activeRooms.has(roomId)) {
      const room = activeRooms.get(roomId);
      room.participants.delete(userId);
      
      // Remove room if empty
      if (room.participants.size === 0) {
        activeRooms.delete(roomId);
      }
    }
    socket.to(roomId).emit('user-disconnected', userId);
    socket.leave(roomId);
  });

  socket.on('disconnect', () => {
    const rooms = Object.keys(socket.rooms);
    rooms.forEach(room => {
      if (room !== socket.id) {
        if (activeRooms.has(room)) {
          const roomData = activeRooms.get(room);
          roomData.participants.delete(socket.id);
          if (roomData.participants.size === 0) {
            activeRooms.delete(room);
          }
        }
        socket.to(room).emit('user-disconnected', socket.id);
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});