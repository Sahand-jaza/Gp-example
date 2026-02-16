export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: "admin" | "teacher" | "parent" | "student";
    };
  }
}
