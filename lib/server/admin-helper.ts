import type { User } from "../types";

export function isAdminUser(user: User | null): boolean {
  return user?.role === "admin";
}
