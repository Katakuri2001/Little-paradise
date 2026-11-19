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
  // Placeholder: server-side activity feed implemented in Foundation & Security phase
  return NextResponse.json({ activities: [] });
}
