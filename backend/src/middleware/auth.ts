import type { Request, Response, NextFunction, RequestHandler } from "express";
import { getAuth, clerkClient } from "@clerk/express";
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

export const requirePermission = (requiredPermission: string): RequestHandler => {
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
export const requireOrgRole = (requiredRole: string): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authData = getAuth(req);
    const { userId, orgRole, sessionClaims } = authData;
    
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Check custom user metadata role as a fallback
    let userRole = (sessionClaims?.metadata as any)?.role || (sessionClaims?.publicMetadata as any)?.role;
    
    // If we couldn't find it in the session token, fetch it from Clerk API directly
    if (!userRole) {
      try {
        const user = await clerkClient.users.getUser(userId);
        userRole = user.publicMetadata?.role;
      } catch (err) {
        console.error("Error fetching user from Clerk API:", err);
      }
    }

    const strippedRole = requiredRole.replace("org:", "");

    if (
      orgRole === requiredRole ||
      userRole === requiredRole ||
      userRole === strippedRole ||
      userRole === "admin"
    ) {
      next();
      return;
    }

    console.warn(`403 Forbidden: user ${userId}. Required: ${requiredRole}. Got orgRole: ${orgRole}, metadataRole: ${userRole}`);
    
    res.status(403).json({
      error: "Forbidden: Insufficient Role",
      required: requiredRole,
      currentOrgRole: orgRole || "None",
      currentMetadataRole: userRole || "None",
    });
  };
};
