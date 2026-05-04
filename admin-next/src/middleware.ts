import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/users(.*)", "/courses(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId, sessionClaims } = await auth();

    // If not signed in, redirect to sign-in
    if (!userId) {
      return (await auth()).redirectToSignIn();
    }

    // Check for admin role
    let rawRole = "none";
    let isAdmin = false;
    
    // 1. FAST PATH: Check Session Claims first
    const metadata = (sessionClaims?.metadata as any) || (sessionClaims?.publicMetadata as any) || {};
    const sessionRole = metadata.role || (sessionClaims as any)?.role || (sessionClaims as any)?.orgRole;
    
    if (sessionRole?.toLowerCase() === "admin" || sessionRole?.toLowerCase() === "org:admin") {
      isAdmin = true;
      rawRole = sessionRole;
    }

    // 2. SLOW PATH: Instant Sync Fix (Only if session is stale)
    if (!isAdmin) {
      console.log(`[Admin Middleware] ⚠️ STALE SESSION for ${userId}. Performing Fresh API Sync...`);
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        
        const freshRole = (user.publicMetadata as any)?.role;
        
        if (freshRole?.toLowerCase() === "admin") {
          isAdmin = true;
          rawRole = freshRole;
          console.log(`[Admin Middleware] ✅ INSTANT SYNC SUCCESS for ${userId}. Role promoted to Admin.`);
        }
      } catch (err) {
        console.error("[Admin Middleware] Fresh role fetch failed:", err);
      }
    }

    if (!isAdmin) {
      console.warn(`[Admin Middleware] ACCESS DENIED for ${userId}. Final Role Found: ${rawRole}`);
      return NextResponse.redirect(new URL("/?error=unauthorized", req.url));
    }
    
    console.log(`[Admin Middleware] ACCESS GRANTED for ${userId}. Role: ${rawRole}`);
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
