import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { getUserPlaylists, updatePlaylist, deletePlaylist } from "@/lib/server/store";
import { jsonError } from "@/lib/server/api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) return jsonError("UNAUTHORIZED", "Unauthorized", 401);
  const { id } = await params;
  const pl = (await getUserPlaylists(u.id)).find((p) => p.id === id);
  if (!pl) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ playlist: pl });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) return jsonError("UNAUTHORIZED", "Unauthorized", 401);
  const body = await req.json();
  const pl = await updatePlaylist(u.id, (await params).id, body ?? {});
  if (!pl) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ playlist: pl });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) return jsonError("UNAUTHORIZED", "Unauthorized", 401);
  await deletePlaylist(u.id, (await params).id);
  return NextResponse.json({ ok: true });
}
