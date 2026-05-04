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

    // Check for admin role in various possible metadata locations
    const rawRole = 
      (sessionClaims?.metadata as any)?.role || 
      (sessionClaims?.publicMetadata as any)?.role || 
      (sessionClaims?.unsafeMetadata as any)?.role ||
      (sessionClaims as any)?.orgRole;

    const isAdmin = rawRole === "admin" || rawRole === "org:admin";

    if (!isAdmin) {
      console.warn(`[Admin Middleware] Access denied for user ${userId}. Role: ${rawRole}`);
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
