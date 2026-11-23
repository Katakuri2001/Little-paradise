import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";

const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_CONTENT_TYPES = ["audio/mpeg", "audio/mp4", "audio/m4a", "audio/wav", "audio/ogg"];

function sanitizeExtension(filename: string): string {
  const ext = filename.split(".").pop() || "bin";
  // Strip path separators and dangerous characters; keep only alphanumeric
  return ext.replace(/[^a-zA-Z0-9]/g, "") || "bin";
}

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

  const ext = sanitizeExtension(filename);
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

  if (body.byteLength > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "File too large" } },
      { status: 413 },
    );
  }

  const contentType = req.headers.get("content-type");
  const resolvedContentType = ALLOWED_CONTENT_TYPES.includes(contentType ?? "")
    ? contentType
    : "audio/mpeg";

  const BUCKET = (globalThis as any).BUCKET;
  if (!BUCKET) {
    return NextResponse.json(
      { error: { code: "UNAVAILABLE", message: "R2 bucket not available" } },
      { status: 503 },
    );
  }

  await BUCKET.put(key, body, {
    httpMetadata: { contentType: resolvedContentType },
  });

  return NextResponse.json({ success: true, key });
}
