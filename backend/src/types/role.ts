export const ROLES = {
  ADMIN: "ADMIN",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  DEVELOPER: "DEVELOPER",
  MEMBER: "MEMBER"
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];