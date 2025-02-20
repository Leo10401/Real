const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Updated CORS configuration
app.use(cors());
app.options('*', cors()); // Enable pre-flight for all routes

const io = new Server(server, {
  cors: {
    origin: true, // Allow all origins in development
    methods: ["GET", "POST"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin"
    ],
    credentials: true
  },
  allowEIO3: true,
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Add health check endpoint
app.get('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send('Server is running');
});

const activeRooms = new Map();

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("join-room", ({ roomId, userId, userName, passcode }) => {
    console.log(`Join request from ${userName} (${userId}) for room ${roomId}`);

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
      socket.emit("join-error", "Invalid passcode");
      return;
    }

    // Add participant to room
    room.participants.set(userId, userName);
    socket.join(roomId);

    // Send current participants list to the joining user
    socket.emit("room-users", Array.from(room.participants.entries()));
    
    // Notify others in the room
    socket.to(roomId).emit("user-connected", { userId, userName });

    console.log(`${userName} joined ${roomId}. Current participants:`, 
      Array.from(room.participants.entries()));

    // Handle WebRTC signaling
    socket.on("signal", (data) => {
      console.log(`Signaling from ${data.from} to ${data.to}`);
      io.to(data.to).emit("signal", {
        signal: data.signal,
        from: data.from
      });
    });

    // Handle disconnection
    const handleDisconnect = () => {
      if (activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);
        room.participants.delete(userId);
        
        if (room.participants.size === 0) {
          activeRooms.delete(roomId);
          console.log(`Room ${roomId} deleted - no participants left`);
        } else {
          socket.to(roomId).emit("user-disconnected", userId);
          console.log(`${userName} left ${roomId}. Remaining participants:`,
            Array.from(room.participants.entries()));
        }
      }
    };

    socket.on("manual-disconnect", handleDisconnect);
    socket.on("disconnect", handleDisconnect);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
