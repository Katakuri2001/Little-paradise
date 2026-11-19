import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/lib/server/store";
import { clearSessionCookie } from "@/lib/server/auth-helper";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("lp_session")?.value;
  if (token) await deleteSession(token);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
