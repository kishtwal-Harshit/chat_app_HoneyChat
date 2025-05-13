import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"]
  },
});

// Store online users and their socket IDs
const userSocketMap = {}; // {userId: socketId}

// Store group rooms and their members
const groupRooms = {}; // {groupId: [socketId1, socketId2]}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} connected with socket ${socket.id}`);
  }

  // Send online users list to all clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle group joining
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    if (!groupRooms[groupId]) {
      groupRooms[groupId] = [];
    }
    groupRooms[groupId].push(socket.id);
    console.log(`User ${userId} joined group ${groupId}`);
  });

  // Handle group message broadcasting
  socket.on("sendGroupMessage", async ({ groupId, message }) => {
    try {
      // Broadcast to all group members including sender
      io.to(groupId).emit("newGroupMessage", {
        groupId,
        message
      });
      console.log(`Message broadcast to group ${groupId}`);
    } catch (error) {
      console.error("Error broadcasting group message:", error);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    if (userId) {
      delete userSocketMap[userId];
      // Remove from all group rooms
      Object.keys(groupRooms).forEach(groupId => {
        groupRooms[groupId] = groupRooms[groupId].filter(id => id !== socket.id);
      });
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

export { io, app, server };