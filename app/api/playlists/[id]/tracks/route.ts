import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { addToPlaylist, removeFromPlaylist } from "@/lib/server/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { trackId } = body ?? {};
  if (!trackId) return NextResponse.json({ error: "trackId required" }, { status: 400 });
  await addToPlaylist(u.id, (await params).id, String(trackId));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const trackId = url.searchParams.get("trackId");
  if (!trackId) return NextResponse.json({ error: "trackId required" }, { status: 400 });
  await removeFromPlaylist(u.id, (await params).id, trackId);
  return NextResponse.json({ ok: true });
}
