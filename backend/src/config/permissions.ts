export const PERMISSIONS = {
  // Admin Permissions
  MANAGE_USERS: "manage:users",
  MANAGE_TEACHERS: "manage:teachers",
  MANAGE_PARENTS: "manage:parents",
  MANAGE_COURSES: "manage:courses",
  VIEW_ADMIN_DASHBOARD: "view:admin_dashboard",

  // Teacher Permissions
  CREATE_COURSE: "create:course",
  EDIT_COURSE: "edit:course",
  DELETE_COURSE: "delete:course",
  VIEW_STUDENT_ANALYTICS: "view:student_analytics",

  // Parent Permissions
  VIEW_CHILD_REPORT: "view:child_report",
  CONNECT_CHILD: "connect:child",

  // Student Permissions
  VIEW_COURSE: "view:course",
  SUBMIT_QUIZ: "submit:quiz",
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_TEACHERS,
    PERMISSIONS.MANAGE_PARENTS,
    PERMISSIONS.MANAGE_COURSES,
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    PERMISSIONS.CREATE_COURSE,
    PERMISSIONS.EDIT_COURSE,
    PERMISSIONS.DELETE_COURSE,
    PERMISSIONS.VIEW_STUDENT_ANALYTICS,
  ],
  teacher: [
    PERMISSIONS.CREATE_COURSE,
    PERMISSIONS.EDIT_COURSE,
    PERMISSIONS.DELETE_COURSE,
    PERMISSIONS.VIEW_STUDENT_ANALYTICS,
  ],
  parent: [PERMISSIONS.VIEW_CHILD_REPORT, PERMISSIONS.CONNECT_CHILD],
  student: [PERMISSIONS.VIEW_COURSE, PERMISSIONS.SUBMIT_QUIZ],
};
