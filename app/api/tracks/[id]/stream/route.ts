import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { getDBWithDemoData } from "@/lib/server/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const u = await getCurrentUser();
  if (!u) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const db = await getDBWithDemoData();
  if (!db) {
    return NextResponse.json(
      { error: { code: "UNAVAILABLE", message: "Database unavailable" } },
      { status: 503 },
    );
  }

  const { id } = await params;
  const track = await db
    .prepare("SELECT * FROM tracks WHERE id = ?")
    .bind(id)
    .first();

  if (!track) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Track not found" } },
      { status: 404 },
    );
  }

  const BUCKET = (globalThis as any).BUCKET;
  if (!BUCKET) {
    return NextResponse.json(
      { error: { code: "UNAVAILABLE", message: "R2 bucket not available" } },
      { status: 503 },
    );
  }

  const object = await BUCKET.get(track.audio_source_reference, {
    type: "stream",
  });

  if (!object) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Audio file not found" } },
      { status: 404 },
    );
  }

  const fileSize = object.size;
  const range = req.headers.get("range");

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const stream = object.body.pipeThrough(
      new TextEncoderStream(), // just to make types happy
    );
    
    return new Response(stream as any, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": "audio/mpeg",
      },
    });
  }

  return new Response(object.body as any, {
    status: 200,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": String(fileSize),
      "Content-Type": "audio/mpeg",
    },
  });
}