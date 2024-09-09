const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Adjust this to your frontend URL
    methods: ["GET", "POST"],
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join a room
  socket.on("join-room", (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    rooms[roomId].push(socket.id);
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);

    // Notify other users in the room
    socket.to(roomId).emit("user-connected", socket.id);
  });

  // Handle offer from client
  socket.on("offer", (offer, roomId) => {
    socket.to(roomId).emit("offer", offer);
  });

  // Handle answer from client
  socket.on("answer", (answer, roomId) => {
    socket.to(roomId).emit("answer", answer);
  });

  // Handle ICE candidates
  socket.on("candidate", (candidate, roomId) => {
    socket.to(roomId).emit("candidate", candidate);
  });

  // Handle end call
  socket.on("end-call", (roomId) => {
    socket.to(roomId).emit("end-call");
    console.log(`Call ended in room ${roomId}`);
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.includes(socket.id)) {
        room.splice(room.indexOf(socket.id), 1);
        socket.to(roomId).emit("user-disconnected", socket.id);
        if (room.length === 0) {
          delete rooms[roomId];
        }
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
