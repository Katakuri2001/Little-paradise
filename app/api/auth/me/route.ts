import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user: { id: u.id, email: u.email, username: u.username, displayName: u.displayName, avatarSeed: u.avatarSeed, createdAt: u.createdAt } });
}
