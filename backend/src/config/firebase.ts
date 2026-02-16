import admin from "firebase-admin";

// Initialize Firebase Admin
// You should set GOOGLE_APPLICATION_CREDENTIALS in .env or pass serviceAccount object
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log("Firebase Admin Initialized");
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

export default admin;
