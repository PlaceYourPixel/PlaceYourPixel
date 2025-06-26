const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const WIDTH = 960;      // halbiert
const HEIGHT = 540;     // halbiert
const COOLDOWN = 20 * 1000; // 20 Sekunden in ms

// 2D-Array für das Canvas, initial weiß (#FFFFFF)
const canvas = Array.from({ length: HEIGHT }, () =>
  Array(WIDTH).fill("#FFFFFF")
);

const lastPlaced = new Map(); // socket.id => timestamp

app.use(express.static("public"));

io.on("connection", (socket) => {
  // Beim Verbinden: komplettes Canvas senden
  socket.emit("init", canvas);

  socket.on("place_pixel", ({ x, y, color }) => {
    const now = Date.now();
    const last = lastPlaced.get(socket.id) || 0;
    if (now - last < COOLDOWN) {
      socket.emit("cooldown", Math.ceil((COOLDOWN - (now - last)) / 1000));
      return;
    }
    if (
      x >= 0 && x < WIDTH &&
      y >= 0 && y < HEIGHT &&
      /^#[0-9A-Fa-f]{6}$/.test(color)
    ) {
      canvas[y][x] = color;
      lastPlaced.set(socket.id, now);
      io.emit("pixel_update", { x, y, color });
    }
  });

  socket.on("disconnect", () => {
    lastPlaced.delete(socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});