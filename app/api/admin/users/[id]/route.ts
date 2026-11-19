import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-helper";
import { getDBWithDemoData } from "@/lib/server/db";
import { auditLog } from "@/lib/server/audit-log";
import { z } from "zod";

const updateSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
});

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
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request body" } },
      { status: 400 },
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
  await db
    .prepare("UPDATE users SET role = ?, status = ? WHERE id = ?")
    .bind(parsed.data.role, parsed.data.status, id)
    .run();

  await auditLog(db, {
    userId: u.id,
    action: parsed.data.role === "admin" ? "promote_user" : "suspend_user",
    targetType: "user",
    targetId: id,
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

  const { id } = await params;
  await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();

  await auditLog(db, {
    userId: u.id,
    action: "delete_user",
    targetType: "user",
    targetId: id,
  });

  return NextResponse.json({ success: true });
}
