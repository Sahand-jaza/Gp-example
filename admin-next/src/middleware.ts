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
    const { sessionClaims } = await auth();
    let rawRole = 
      (sessionClaims?.metadata as any)?.role || 
      (sessionClaims?.publicMetadata as any)?.role || 
      (sessionClaims?.unsafeMetadata as any)?.role ||
      (sessionClaims as any)?.orgRole;

    let isAdmin = rawRole === "admin" || rawRole === "org:admin";

    // Instant Sync Fix: If not admin in session, check fresh Clerk API state
    if (!isAdmin) {
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        rawRole = (user.publicMetadata as any)?.role;
        isAdmin = rawRole === "admin";
        console.log(`[Admin Middleware] Fresh API Role Check for ${userId}: ${rawRole}`);
      } catch (err) {
        console.error("[Admin Middleware] Fresh role fetch failed:", err);
      }
    }

    if (!isAdmin) {
      console.warn(`[Admin Middleware] Access denied for user ${userId}. Final Role: ${rawRole}`);
      return NextResponse.redirect(new URL("/?error=unauthorized", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
