import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const u = await getCurrentUser();
  if (!u) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }
  // Placeholder: server-side user activity implemented in Foundation & Security phase
  return NextResponse.json({ activities: [] });
}
