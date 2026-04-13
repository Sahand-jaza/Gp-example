import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-up", req.url));
  }

  try {
    const client = await clerkClient();
    
    // Explicitly set the teacher role immediately after signup
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: "teacher" },
      unsafeMetadata: { role: "teacher" } // Keep unsafe synced just in case
    });

    console.log("Automatically upgraded new signup to teacher:", userId);
  } catch (error) {
    console.error("Failed to set teacher role on signup:", error);
  }

  // Redirect them to the dashboard now that they are officially a teacher
  return NextResponse.redirect(new URL("/dashboard", req.url));
}
