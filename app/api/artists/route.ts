import { NextResponse } from "next/server";
import { ARTISTS } from "@/lib/demo-data";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    const a = ARTISTS.find((x) => x.id === id);
    if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ artist: a });
  }
  return NextResponse.json({ artists: ARTISTS });
}
