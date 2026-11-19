import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { getHistory, addHistory } from "@/lib/server/store";
import { historyAddSchema } from "@/lib/schemas";
import { jsonError, zodError } from "@/lib/server/api";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return jsonError("UNAUTHORIZED", "Unauthorized", 401);
  return NextResponse.json({ history: await getHistory(u.id) });
}

export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return jsonError("UNAUTHORIZED", "Unauthorized", 401);
  const body = await req.json();
  const parsed = historyAddSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);
  await addHistory(u.id, parsed.data.trackId, parsed.data.listenedDuration ?? 0);
  return NextResponse.json({ ok: true });
}
