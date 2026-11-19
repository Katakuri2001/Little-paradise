import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }
  // Placeholder: server-side rooms list implemented in Foundation & Security phase
  return NextResponse.json({ rooms: [] });
}

export async function POST(_req: Request) {
  const u = await getCurrentUser();
  if (!u) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }
  // Placeholder: server-side room creation implemented in Foundation & Security phase
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: "Room creation not yet implemented" } },
    { status: 501 },
  );
}
