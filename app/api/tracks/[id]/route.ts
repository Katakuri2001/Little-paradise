import { NextResponse } from "next/server";
import { TRACKS } from "@/lib/demo-data";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = TRACKS.find((x) => x.id === id);
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ track: t });
}
