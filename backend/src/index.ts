console.log("STARTING SERVER...");
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db";
import { createServer } from "http";
import { WebSocketServer } from "ws";

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Clerk Middleware
import { clerkMiddleware, getAuth, clerkClient } from "@clerk/express";
import {
  requireAuth,
  requirePermission,
  requireOrgRole,
} from "./middleware/auth";
import { PERMISSIONS } from "./config/permissions";
app.use(clerkMiddleware());

// Routes
import webhookRoutes from "./routes/webhookRoutes";
import connectionRoutes from "./routes/connectionRoutes";
import contentRoutes from "./routes/contentRoutes";
import trackingRoutes from "./routes/trackingRoutes";
import commentRoutes from "./routes/commentRoutes";
import aiRoutes from "./routes/aiRoutes";
import quizRoutes from "./routes/quizRoutes";
import studentRoutes from "./routes/studentRoutes";
import { startCronJobs } from "./utils/cron";

app.use("/api/webhooks", webhookRoutes);
app.use("/api/connect", connectionRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/courses", contentRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/quizzes", quizRoutes);

// Start Cron
startCronJobs();

// Basic Route
app.get("/", (req, res) => {
  res.send("FKS Platform Backend Running");
});

// Check environment variables
if (!process.env.CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
  console.error("Missing CLERK_PUBLISHABLE_KEY or CLERK_SECRET_KEY");
} else {
  console.log(
    "CLERK Keys Loaded. Secret starts with:",
    process.env.CLERK_SECRET_KEY.substring(0, 10),
  );
}

// Protected Route Example
app.get(
  "/protected",
  (req, res, next) => {
    console.log(
      "Protected route hit. Headers:",
      JSON.stringify(req.headers.authorization),
    );
    next();
  },
  requireAuth(),
  async (req, res) => {
    const { userId } = getAuth(req);
    try {
      const user = await clerkClient.users.getUser(userId!);
      res.json({ message: "Protected route accessed", user });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  },
);

// Role & Permission Verification Routes

app.get(
  "/api/test/teacher",
  requireAuth(),
  requireOrgRole("org:teacher"),
  (req, res) => {
    res.json({ message: "Teacher access granted", user: getAuth(req).userId });
  },
);

app.get(
  "/api/test/student",
  requireAuth(),
  requireOrgRole("org:student"),
  (req, res) => {
    res.json({ message: "Student access granted", user: getAuth(req).userId });
  },
);

// WebSocket Logic
// Store rooms: key = "student_ID", value = Set<WebSocket>
const rooms = new Map<string, Set<any>>();

wss.on("connection", (ws) => {
  console.log("New WebSocket Connection");

  // Track current room for this socket
  let currentRoom: string | null = null;

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      // 1. JOIN_ROOM (Parent joins to watch a student)
      if (data.type === "JOIN_ROOM") {
        const { studentId } = data;
        const roomName = `student_${studentId}`;

        if (!rooms.has(roomName)) {
          rooms.set(roomName, new Set());
        }
        rooms.get(roomName)?.add(ws);
        currentRoom = roomName;
        console.log(`Client joined room: ${roomName}`);
      }

      // 2. HEARTBEAT (Student sends data -> Broadcast to Parent)
      if (data.type === "HEARTBEAT") {
        const { studentId, focus, videoId } = data;
        const roomName = `student_${studentId}`;

        // Broadcast to everyone in this room (Parents)
        if (rooms.has(roomName)) {
          rooms.get(roomName)?.forEach((client) => {
            if (client !== ws && client.readyState === 1) {
              // 1 = OPEN
              client.send(JSON.stringify({ type: "UPDATE", focus, videoId }));
            }
          });
        }
      }
    } catch (e) {
      console.error("WS Error:", e);
    }
  });

  ws.on("close", () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom)?.delete(ws);
      if (rooms.get(currentRoom)?.size === 0) {
        rooms.delete(currentRoom);
      }
    }
    console.log("WebSocket Disconnected");
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
