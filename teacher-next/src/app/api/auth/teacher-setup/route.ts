import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { userId } = await auth();
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const expectedCode = process.env.TEACHER_INVITE_CODE || "TEACHER_2024";
  
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-up", req.url));
  }

  if (code !== expectedCode) {
    console.warn(`Invalid teacher invite code attempted by user ${userId}`);
    return NextResponse.redirect(new URL("/?error=invalid_invite", req.url));
  }

  try {
    const client = await clerkClient();
    
    // Explicitly set the teacher role securely
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: "teacher" }
    });

    console.log("Upgraded user to teacher using valid invite code:", userId);
  } catch (error) {
    console.error("Failed to set teacher role:", error);
  }

  // Redirect them to the dashboard now that they are officially a teacher
  return NextResponse.redirect(new URL("/dashboard", req.url));
}
