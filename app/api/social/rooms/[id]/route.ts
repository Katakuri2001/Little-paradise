import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }
  // Placeholder: server-side room detail implemented in Foundation & Security phase
  return NextResponse.json({ error: { code: "NOT_IMPLEMENTED", message: "Room detail not yet implemented" } }, { status: 501 });
}

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: "Room update not yet implemented" } },
    { status: 501 },
  );
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: "Room delete not yet implemented" } },
    { status: 501 },
  );
}
