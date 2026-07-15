const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");


const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 8000;

const userSocketMap = {}; // syntax : {socketid: username}

const getAllConnectedClients = (roomId) => {
  // returns map, therefor casting
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map( 
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      }
    }
  ) 
}

io.on("connection", (socket) => {
  // console.log(`user connected: ${socket.id}`);

  socket.on('join', ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    // console.log(clients);
    // notify to all user that new user are joined
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit('joined', {
        clients, 
        username, 
        socketId: socket.id,
      })
    })
  });
  socket.on('code-change', ({ roomId, code }) => {
    socket.in(roomId).emit('code-change', { code });
  })
  // socket.on('sync-code', ({ socketId, code }) => {
  //   io.to(socketId).emit('sync-code', { code });
  // })
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit("disconnected", {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
  });
});

server.listen(PORT, () => {
  console.log("server is running");
});