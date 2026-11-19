import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { getDBWithDemoData } from "@/lib/server/db";
import { auditLog } from "@/lib/server/audit-log";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") {
    return NextResponse.json(
      { error: { code: u ? "FORBIDDEN" : "UNAUTHORIZED", message: u ? "Forbidden" : "Unauthorized" } },
      { status: u ? 403 : 401 },
    );
  }

  const body = await req.json();
  const { name, biography } = body as { name?: string; biography?: string };

  const db = await getDBWithDemoData();
  if (!db) {
    return NextResponse.json(
      { error: { code: "UNAVAILABLE", message: "Database unavailable" } },
      { status: 503 },
    );
  }

  await db
    .prepare("UPDATE artists SET name = COALESCE(?, name), biography = COALESCE(?, biography) WHERE id = ?")
    .bind(name, biography, (await params).id)
    .run();

  await auditLog(db, {
    userId: u.id,
    action: "update_artist",
    targetType: "artist",
    targetId: (await params).id,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") {
    return NextResponse.json(
      { error: { code: u ? "FORBIDDEN" : "UNAUTHORIZED", message: u ? "Forbidden" : "Unauthorized" } },
      { status: u ? 403 : 401 },
    );
  }

  const db = await getDBWithDemoData();
  if (!db) {
    return NextResponse.json(
      { error: { code: "UNAVAILABLE", message: "Database unavailable" } },
      { status: 503 },
    );
  }

  await db.prepare("DELETE FROM artists WHERE id = ?").bind((await params).id).run();

  await auditLog(db, {
    userId: u.id,
    action: "delete_artist",
    targetType: "artist",
    targetId: (await params).id,
  });

  return NextResponse.json({ success: true });
}
