import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { getFavorites } from "@/lib/server/store";
import { jsonError } from "@/lib/server/api";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return jsonError("UNAUTHORIZED", "Unauthorized", 401);
  return NextResponse.json({ favorites: await getFavorites(u.id) });
}
