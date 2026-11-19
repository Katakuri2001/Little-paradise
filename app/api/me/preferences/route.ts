import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { getPrefs, setPrefs } from "@/lib/server/store";
import { preferencesPatchSchema } from "@/lib/schemas";
import { jsonError, zodError } from "@/lib/server/api";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return jsonError("UNAUTHORIZED", "Unauthorized", 401);
  return NextResponse.json({ preferences: await getPrefs(u.id) });
}

export async function PATCH(req: Request) {
  const u = await getCurrentUser();
  if (!u) return jsonError("UNAUTHORIZED", "Unauthorized", 401);
  const body = await req.json();
  const parsed = preferencesPatchSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);
  const prefs = await setPrefs(u.id, parsed.data);
  return NextResponse.json({ preferences: prefs });
}
