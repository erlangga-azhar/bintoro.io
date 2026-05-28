import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server } from "socket.io";
import helmet from "helmet";

async function startServer() {
  const app = express();
  
  // Security Headers Setup
  // Menggunakan helmet untuk melindungi dari umum web vulnerabilities
  app.use(helmet({
    // Matikan CSP untuk sementara agar tidak memblokir inline-style Vite, 
    // tapi aktifkan perlindungan Clickjacking (X-Frame-Options) dan XSS filter
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  
  // Custom header X-Frame-Options untuk mencegah Clickjacking / Embed oleh website asing
  app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    next();
  });

  const PORT = 3000;
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
    }
  });

  // Track players
  const players = new Map();

  io.on("connection", (socket) => {
    console.log("Player joined:", socket.id);
    
    socket.on("join", (data) => {
      players.set(socket.id, {
        id: socket.id,
        name: data.name,
        avatar: data.avatar,
        x: data.x || 0,
        y: data.y || 0,
        appState: data.appState,
        levelRank: data.levelRank,
      });
      // tell the new player about existing players
      socket.emit("currentPlayers", Array.from(players.values()));
      // tell others about the new player
      socket.broadcast.emit("playerJoined", players.get(socket.id));
    });

    socket.on("move", (pos) => {
      const p = players.get(socket.id);
      if (p) {
        p.x = pos.x;
        p.y = pos.y;
        socket.broadcast.emit("playerMoved", { id: socket.id, x: pos.x, y: pos.y });
      }
    });

    socket.on("updateState", (data) => {
      const p = players.get(socket.id);
      if (p) {
        if (data.inventory !== undefined) p.inventory = data.inventory;
        if (data.completedNpcs !== undefined) p.completedNpcs = data.completedNpcs;
        if (data.appState !== undefined) p.appState = data.appState;
        if (data.selectedEquipment !== undefined) p.selectedEquipment = data.selectedEquipment;
        
        socket.broadcast.emit("playerUpdated", {
          id: socket.id,
          inventory: p.inventory,
          completedNpcs: p.completedNpcs,
          appState: p.appState,
          selectedEquipment: p.selectedEquipment
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("Player left:", socket.id);
      players.delete(socket.id);
      io.emit("playerLeft", socket.id);
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
