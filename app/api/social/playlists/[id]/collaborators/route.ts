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
  // Placeholder: server-side collaborators list implemented in Foundation & Security phase
  return NextResponse.json({ collaborators: [] });
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: "Collaborator add not yet implemented" } },
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
    { error: { code: "NOT_IMPLEMENTED", message: "Collaborator remove not yet implemented" } },
    { status: 501 },
  );
}
