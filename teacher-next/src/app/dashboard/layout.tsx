import Sidebar from "@/components/dashboard/Sidebar";
import { auth, clerkClient } from "@clerk/nextjs/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  // We check the session claims first, as a lightweight check
  const tokenRole = 
    (session?.sessionClaims?.metadata as any)?.role || 
    (session?.sessionClaims?.publicMetadata as any)?.role || 
    (session?.sessionClaims?.unsafeMetadata as any)?.role;
  
  if (session?.userId && tokenRole !== "teacher") {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(session.userId);
      const actualRole = user.publicMetadata?.role || user.unsafeMetadata?.role;
      
      // Only upgrade if they genuinely don't have the teacher role in Clerk's DB
      if (actualRole !== "teacher") {
        await client.users.updateUserMetadata(session.userId, {
          publicMetadata: { role: "teacher" },
          unsafeMetadata: { role: "teacher" } // Overwrite everything to be safe
        });
        console.log(`Auto-upgraded user ${session.userId} to teacher via Dashboard!`);
      }
    } catch (err) {
      console.error("Error auto-upgrading to teacher:", err);
    }
  }

  return (
    <div className="flex bg-gray-50 h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden overflow-y-auto w-full">
        {children}
      </div>
    </div>
  );
}
