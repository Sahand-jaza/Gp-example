import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/api/webhooks(.*)"]);
const isProtectedRoute = createRouteMatcher(["/", "/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return; // Allow Clerk webhooks to pass unauthenticated

  if (isProtectedRoute(req)) {
    const { userId, sessionClaims } = await auth();

    // Fix #8: Not signed in → redirect to sign-in
    if (!userId) {
      return (await auth()).redirectToSignIn();
    }

    // Fix #8: Check for teacher role in all possible metadata locations
    const rawRole =
      (sessionClaims?.metadata as any)?.role ||
      (sessionClaims?.publicMetadata as any)?.role ||
      (sessionClaims?.unsafeMetadata as any)?.role ||
      (sessionClaims as any)?.orgRole;

    const isTeacher =
      rawRole === "teacher" ||
      rawRole === "org:teacher" ||
      rawRole === "admin" || // Admins can access teacher dashboard
      rawRole === "org:admin";

    if (!isTeacher) {
      console.warn(
        `[Teacher Middleware] Access denied for user ${userId}. Role: ${rawRole}`
      );
      return NextResponse.redirect(new URL("/?error=unauthorized", req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
