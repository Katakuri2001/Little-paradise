import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { getUserPlaylists, createPlaylist } from "@/lib/server/store";
import { playlistCreateSchema } from "@/lib/schemas";
import { jsonError, zodError } from "@/lib/server/api";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return jsonError("UNAUTHORIZED", "Unauthorized", 401);
  return NextResponse.json({ playlists: await getUserPlaylists(u.id) });
}

export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return jsonError("UNAUTHORIZED", "Unauthorized", 401);
  const body = await req.json();
  const parsed = playlistCreateSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);
  const pl = await createPlaylist(u.id, parsed.data.name, parsed.data.description ?? "");
  return NextResponse.json({ playlist: pl });
}
