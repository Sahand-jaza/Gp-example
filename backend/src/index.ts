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
dotenv.config({ override: true });

// Connect to MongoDB
connectDB();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Webhook Route needs raw body for Svix
import webhookRoutes from "./routes/webhookRoutes";
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRoutes);

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN
    ? process.env.ALLOWED_ORIGIN.split(',')
    : [
        'http://localhost:3000', 'http://localhost:3001', 
        'http://127.0.0.1:3000', 'http://127.0.0.1:3001',
        'http://localhost:5173', 'http://localhost:5174', 
        'http://localhost:8081', 'app://.'
      ],
  credentials: true,
}));
app.use(helmet());
app.use(morgan("dev"));

// Debug request logger (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[DEBUG] Incoming Request: ${req.method} ${req.originalUrl}`);
    next();
  });
}

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
// Webhook routes already mounted above
import connectionRoutes from "./routes/connectionRoutes";
import contentRoutes from "./routes/contentRoutes";
import trackingRoutes from "./routes/trackingRoutes";
import commentRoutes from "./routes/commentRoutes";
import aiRoutes from "./routes/aiRoutes";
import quizRoutes from "./routes/quizRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import studentRoutes from "./routes/studentRoutes";
import parentRoutes from "./routes/parentRoutes";
import adminRoutes from "./routes/adminRoutes";
import feedbackRoutes from "./routes/feedbackRoutes";
import { startCronJobs } from "./utils/cron";
app.use("/api/connect", connectionRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", contentRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/feedback", feedbackRoutes);

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

// Fix #9: Helper to verify Clerk JWT from WebSocket handshake query param
async function verifyWsToken(token: string | null): Promise<string | null> {
  if (!token) return null;
  try {
    const { verifyToken } = await import("@clerk/backend");
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    return payload.sub ?? null; // sub = clerkId
  } catch (error: any) {
    console.error("[WS] Token verification failed:", error);
    require('fs').appendFileSync('ws-error.log', `Error: ${error.message}\nToken: ${token}\n`);
    return null;
  }
}

wss.on("connection", async (ws, req) => {
  // Fix #9: Extract and verify Clerk JWT from ?token= query param
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const token = url.searchParams.get("token");
  const verifiedUserId = await verifyWsToken(token);

  if (!verifiedUserId) {
    console.warn("[WS] Unauthenticated connection rejected");
    ws.close(1008, "Unauthorized"); // 1008 = Policy Violation
    return;
  }

  console.log(`New WebSocket Connection: user ${verifiedUserId}`);

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
        const { studentId, focus, videoId, emotion, isTabbedOut } = data;

        // Fix #9: Ensure the heartbeat sender is the actual student (not a forged studentId)
        if (studentId !== verifiedUserId) {
          console.warn(`[WS] HEARTBEAT spoofing attempt: ${verifiedUserId} sent as ${studentId}`);
          return;
        }

        const roomName = `student_${studentId}`;

        // Broadcast to everyone in this room (Parents)
        if (rooms.has(roomName)) {
          rooms.get(roomName)?.forEach((client) => {
            if (client !== ws && client.readyState === 1) {
              // 1 = OPEN
              client.send(JSON.stringify({ type: "UPDATE", focus, videoId, emotion, isTabbedOut }));
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
