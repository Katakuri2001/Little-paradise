/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getSessionUser } from "./session-store";
import type { User } from "@/lib/types";

const PUBLIC_PATH_PREFIXES = [
  "/",
  "/explore",
  "/search",
  "/auth",
  "/api/auth",
  "/api/tracks",
  "/api/artists",
  "/api/albums",
  "/api/search",
  "/_next",
  "/api/_next",
  "/favicon.ico",
];

const AUTH_REQUIRED_PATH_PREFIXES = [
  "/library",
  "/profile",
  "/settings",
  "/api/me",
  "/api/playlists",
];

const ADMIN_PATH_PREFIXES = ["/admin"];

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export type MiddlewareResult =
  | { action: "allow" }
  | { action: "redirect"; url: string }
  | { action: "respond"; response: Response };

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export function isAuthRequiredPath(pathname: string): boolean {
  return AUTH_REQUIRED_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export function isAdminPath(pathname: string): boolean {
  return ADMIN_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export function isMutatingMethod(method: string): boolean {
  return MUTATING_METHODS.has(method);
}

export async function processRequest(
  pathname: string,
  method: string,
  token: string | null,
  origin: string | null,
  host: string | null,
  db: any,
): Promise<MiddlewareResult> {
  // Public paths are always accessible
  if (isPublicPath(pathname)) {
    return { action: "allow" };
  }

  // Resolve user from session token
  let user: User | null = null;
  if (token) {
    try {
      user = (await getSessionUser(db, token)) as User | null;
    } catch {
      // Session resolution failed, treat as unauthenticated
    }
  }

  // Check if path requires authentication
  if (isAuthRequiredPath(pathname) || isAdminPath(pathname)) {
    if (!user) {
      if (pathname.startsWith("/api/")) {
        return {
          action: "respond",
          response: NextResponse.json(
            { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
            { status: 401 },
          ),
        };
      }
      return {
        action: "redirect",
        url: `/auth/login?next=${encodeURIComponent(pathname)}`,
      };
    }

    // Admin paths require admin role
    if (isAdminPath(pathname) && user.role !== "admin") {
      return {
        action: "respond",
        response: NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Forbidden" } },
          { status: 403 },
        ),
      };
    }
  }

  // CSRF protection on mutating routes
  if (isMutatingMethod(method)) {
    if (!origin || !host) {
      return {
        action: "respond",
        response: NextResponse.json(
          { error: { code: "CSRF_ERROR", message: "CSRF token missing" } },
          { status: 403 },
        ),
      };
    }
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return {
          action: "respond",
          response: NextResponse.json(
            { error: { code: "CSRF_ERROR", message: "CSRF token missing" } },
            { status: 403 },
          ),
        };
      }
    } catch {
      return {
        action: "respond",
        response: NextResponse.json(
          { error: { code: "CSRF_ERROR", message: "CSRF token missing" } },
          { status: 403 },
        ),
      };
    }
  }

  return { action: "allow" };
}
