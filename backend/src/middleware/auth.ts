import type { Request, Response, NextFunction, RequestHandler } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import User from "../models/User";

// Custom requireAuth middleware that enforces JSON 401 response
export const requireAuth = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req);
    const userId = auth.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Attach to req for use in subsequent controllers
    (req as any).userId = userId;
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

    // Priority Fix: Always check MongoDB first for the most up-to-date role
    let userRole: string | null = null;
    try {
      const dbUser = await User.findOne({ clerkId: userId }).lean() as any;
      if (dbUser && dbUser.role) {
        userRole = dbUser.role;
        console.log(`[DEBUG] Role prioritized from MongoDB for user ${userId}: ${userRole}`);
      }
    } catch (err) {
      console.error("Error fetching user from MongoDB:", err);
    }

    // Fallback to session claims if not in DB
      if (!userRole) {
        try {
          const user = await clerkClient.users.getUser(userId);
          userRole = (user.publicMetadata?.role as string) || (user.unsafeMetadata?.role as string);
        } catch (err) {
          console.error("Error fetching user from Clerk API:", err);
        }
      }

    // Attach to request for use in controllers
    (req as any).userRole = userRole;

    const strippedRole = requiredRole.replace("org:", "");

    if (
      orgRole === requiredRole ||
      userRole === requiredRole ||
      userRole === strippedRole ||
      userRole === "admin"
    ) {
      // Auto-sync role to MongoDB just in case the webhook failed or Ngrok isn't running
      try {
        let dbUser = await User.findOne({ clerkId: userId });
        
        if (!dbUser) {
           const clerkUser = await clerkClient.users.getUser(userId);
           const email = clerkUser.emailAddresses[0]?.emailAddress || "";
           const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Unknown";
           const { ROLE_PERMISSIONS } = await import("../config/permissions");
           
           dbUser = await User.create({
             clerkId: userId,
             email,
             name,
             role: userRole || strippedRole,
             permissions: ROLE_PERMISSIONS[userRole || strippedRole] || []
           });
           console.log(`Auto-created missing MongoDB user ${userId} with role ${userRole || strippedRole}`);
        } else if (userRole && dbUser.role !== userRole) {
           dbUser.role = userRole as "parent" | "student" | "teacher" | "admin";
           const { ROLE_PERMISSIONS } = await import("../config/permissions");
           dbUser.permissions = ROLE_PERMISSIONS[userRole] || [];
           await dbUser.save();
           console.log(`Auto-synced MongoDB role to ${userRole} for user ${userId}`);
        }
      } catch (e) {
        console.error("Auto-sync MongoDB failed:", e);
      }

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
