import { cookies } from "next/headers";
import { getSessionUser, createSession, deleteSession } from "./store";

export type EnvMode = "development" | "production" | "preview";

export function getSessionCookieOptions(
  token: string,
  env: EnvMode = "development",
) {
  return {
    httpOnly: true,
    secure: env === "production" || env === "preview",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("lp_session")?.value;
  return await getSessionUser(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  const env = (process.env.VERCEL_ENV === "preview"
    ? "preview"
    : process.env.NODE_ENV) as EnvMode;
  cookieStore.set("lp_session", token, getSessionCookieOptions(token, env));
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set("lp_session", "", { path: "/", maxAge: 0, secure: false, sameSite: "lax" });
}

export { createSession, deleteSession };
