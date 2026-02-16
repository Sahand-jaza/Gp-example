import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import User from "../models/User";

// Custom requireAuth middleware that enforces JSON 401 response
export const requireAuth = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { userId, sessionId, getToken } = getAuth(req);

    console.log("Auth Middleware Hit:", {
      path: req.path,
      userId,
      sessionId,
      headers: req.headers.authorization ? "Present" : "Missing",
    });

    if (!userId) {
      console.log("Auth Failed: No userId found.");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    next();
  };
};

export const requirePermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const user = await User.findOne({ clerkId: userId });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const hasPermission = user.permissions.includes(requiredPermission);

      if (!hasPermission) {
        res.status(403).json({ error: "Forbidden: Insufficient Permissions" });
        return;
      }

      next();
    } catch (error) {
      console.error("Permission Check Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
};
// Custom requireOrgRole middleware
export const requireOrgRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { userId, orgRole } = getAuth(req);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (orgRole !== requiredRole) {
      res.status(403).json({
        error: "Forbidden: Insufficient Organization Role",
        required: requiredRole,
        current: orgRole || "None",
      });
      return;
    }

    next();
  };
};
