import express from "express";
import { requireAuth, requireOrgRole } from "../middleware/auth";
import { 
  getDashboardStats, 
  getAllUsers, 
  getAllTeachers, 
  getAllParents, 
  getAllCourses,
  deleteUser,
  createUser,
  createAdminCourse,
  updateUserStatus,
  updateUser,
  updateAdminCourse,
  getPlatformSettings,
  updatePlatformSettings
} from "../controllers/adminController";

const router = express.Router();

// Stats
router.get("/stats", requireAuth(), requireOrgRole("admin"), getDashboardStats);

// Settings
router.get("/settings", requireAuth(), requireOrgRole("admin"), getPlatformSettings);
router.put("/settings", requireAuth(), requireOrgRole("admin"), updatePlatformSettings);

// Management
router.get("/users", requireAuth(), requireOrgRole("admin"), getAllUsers);
router.get("/teachers", requireAuth(), requireOrgRole("admin"), getAllTeachers);
router.get("/parents", requireAuth(), requireOrgRole("admin"), getAllParents);
router.get("/courses", requireAuth(), requireOrgRole("admin"), getAllCourses);

router.post("/users", requireAuth(), requireOrgRole("admin"), createUser);
router.post("/courses", requireAuth(), requireOrgRole("admin"), createAdminCourse);
router.patch("/courses/:courseId", requireAuth(), requireOrgRole("admin"), updateAdminCourse);
router.patch("/users/:userId/status", requireAuth(), requireOrgRole("admin"), updateUserStatus);
router.put("/users/:userId", requireAuth(), requireOrgRole("admin"), updateUser);
router.delete("/users/:userId", requireAuth(), requireOrgRole("admin"), deleteUser);

export default router;
