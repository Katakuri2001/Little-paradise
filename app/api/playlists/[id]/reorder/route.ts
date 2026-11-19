import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { reorderPlaylist } from "@/lib/server/store";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { from, to } = body ?? {};
  if (typeof from !== "number" || typeof to !== "number") return NextResponse.json({ error: "from/to required" }, { status: 400 });
  await reorderPlaylist(u.id, (await params).id, from, to);
  return NextResponse.json({ ok: true });
}
