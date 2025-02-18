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
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    socket.to(roomId).emit("user-connected", socket.id);
  });

  // Relay signaling data (offer, answer, ICE candidates)
  socket.on("signal", (data) => {
    // data: { to, from, signal }
    console.log(`Signal from ${data.from} to ${data.to}`);
    io.to(data.to).emit("signal", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () =>
  console.log(`Signaling server listening on port ${PORT}`)
);