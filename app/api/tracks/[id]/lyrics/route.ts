import { NextResponse } from "next/server";
import { TRACKS } from "@/lib/demo-data";
import { DEMO_LYRICS } from "@/lib/lyrics/parseLrc";
import { parseLrc } from "@/lib/lyrics/parseLrc";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = TRACKS.find((x) => x.id === id);
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const lrc = DEMO_LYRICS[id];
  if (!lrc) return NextResponse.json({ lyrics: null });
  const lines = parseLrc(lrc, 0);
  return NextResponse.json({
    lyrics: {
      trackId: id,
      format: "lrc",
      language: "en",
      content: lrc,
      offset: 0,
      lines,
      source_provider: "demo",
      license_reference: "Demo content for demonstration",
    },
  });
}
