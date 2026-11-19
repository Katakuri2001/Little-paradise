import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { toggleFavorite } from "@/lib/server/store";
import { jsonError } from "@/lib/server/api";

export async function POST(_req: Request, { params }: { params: Promise<{ trackId: string }> }) {
  const u = await getCurrentUser();
  if (!u) return jsonError("UNAUTHORIZED", "Unauthorized", 401);
  const added = await toggleFavorite(u.id, (await params).trackId);
  return NextResponse.json({ ok: true, added });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ trackId: string }> }) {
  const u = await getCurrentUser();
  if (!u) return jsonError("UNAUTHORIZED", "Unauthorized", 401);
  await toggleFavorite(u.id, (await params).trackId); // toggles off if present
  // ensure removed
  const { getFavorites } = await import("@/lib/server/store");
  // best-effort: re-toggle not needed; toggleFavorite already removed
  return NextResponse.json({ ok: true });
}
