const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");


const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 8000;

io.on("connection", (socket) => {
  console.log(`user connected: ${socket.id}`);
});

server.listen(PORT, () => {
  console.log("server is running");
});