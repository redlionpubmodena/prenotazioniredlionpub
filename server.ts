import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("reservations.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    tableName TEXT NOT NULL,
    peopleCount INTEGER NOT NULL,
    tableNumber TEXT,
    time TEXT NOT NULL,
    room TEXT NOT NULL,
    event TEXT NOT NULL,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/reservations/:date", (req, res) => {
    const { date } = req.params;
    const stmt = db.prepare("SELECT * FROM reservations WHERE date = ? ORDER BY createdAt ASC");
    const reservations = stmt.all(date);
    res.json(reservations);
  });

  app.post("/api/reservations", (req, res) => {
    const { date, tableName, peopleCount, tableNumber, time, room, event, notes } = req.body;
    const stmt = db.prepare(`
      INSERT INTO reservations (date, tableName, peopleCount, tableNumber, time, room, event, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(date, tableName, peopleCount, tableNumber, time, room, event, notes);
    const newReservation = { id: result.lastInsertRowid, ...req.body };
    
    io.emit("reservation_added", newReservation);
    res.status(201).json(newReservation);
  });

  app.delete("/api/reservations/:id", (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare("DELETE FROM reservations WHERE id = ?");
    stmt.run(id);
    
    io.emit("reservation_deleted", id);
    res.status(204).send();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  io.on("connection", (socket) => {
    console.log("Client connected");
    socket.on("disconnect", () => console.log("Client disconnected"));
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
