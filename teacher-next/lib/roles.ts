import { auth } from "@clerk/nextjs/server";

export const checkRole = async (role: string) => {
  const { sessionClaims } = await auth();
  return (sessionClaims?.metadata as { role?: string })?.role === role;
};
