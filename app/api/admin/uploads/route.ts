import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";

export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") {
    return NextResponse.json(
      {
        error: {
          code: u ? "FORBIDDEN" : "UNAUTHORIZED",
          message: u ? "Forbidden" : "Unauthorized",
        },
      },
      { status: u ? 403 : 401 },
    );
  }

  const body = await req.json();
  const { filename, contentType } = body as {
    filename?: string;
    contentType?: string;
  };

  if (!filename) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "filename is required" } },
      { status: 400 },
    );
  }

  const ext = filename.split(".").pop() || "bin";
  const key = `uploads/${crypto.randomUUID()}.${ext}`;

  return NextResponse.json({
    key,
    bucket: "little-paradise-assets",
    uploadUrl: `/api/admin/uploads/${key}`,
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<Record<string, string>> },
): Promise<NextResponse> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") {
    return NextResponse.json(
      {
        error: {
          code: u ? "FORBIDDEN" : "UNAUTHORIZED",
          message: u ? "Forbidden" : "Unauthorized",
        },
      },
      { status: u ? 403 : 401 },
    );
  }

  const { key } = await params;
  const body = await req.arrayBuffer();

  const BUCKET = (globalThis as any).BUCKET;
  if (!BUCKET) {
    return NextResponse.json(
      { error: { code: "UNAVAILABLE", message: "R2 bucket not available" } },
      { status: 503 },
    );
  }

  await BUCKET.put(key, body, {
    httpMetadata: { contentType: "audio/mpeg" },
  });

  return NextResponse.json({ success: true, key });
}
