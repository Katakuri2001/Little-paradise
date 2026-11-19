"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGuard from "@/components/layout/AdminGuard";
import { AdminTable } from "@/components/ui/AdminTable";
import { AdminBadge } from "@/components/ui/AdminBadge";
import { isAdminUser } from "@/lib/server/admin-helper";
import { useLibraryStore } from "@/lib/store/libraryStore";
import type { User } from "@/lib/types";

export default function AdminUsers() {
  const user = useLibraryStore((s) => s.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isAdminUser(user)) return null;

  useEffect(() => {
    let cancelled = false;
    async function fetchUsers() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/users", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load users");
        const data = await res.json();
        if (!cancelled) setUsers(data.users || []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchUsers();
    return () => { cancelled = true; };
  }, []);

  async function handleAction(action: "promote" | "suspend" | "delete", id: string) {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      if (action === "delete") {
        const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete user");
      } else {
        const res = await fetch(`/api/admin/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: action === "promote" ? "admin" : "user", status: action === "suspend" ? "suspended" : "active" }),
        });
        if (!res.ok) throw new Error("Failed to update user");
      }
      setUsers(users.filter((u) => u.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unknown error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">User Management</h1>
        <Link href="/admin" className="px-4 py-2 rounded-full bg-white/10 text-muted hover:bg-white/20">
          Back to Dashboard
        </Link>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted">Loading users...</p>
        </div>
      )}

      {!loading && error && (
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
            className="mt-4 px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:scale-105 transition"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="text-muted">
            Manage users and their roles. Server-side RBAC and admin API routes are fully enforced.
          </p>

          <AdminTable
            columns={[
              { key: "email", label: "Email" },
              { key: "username", label: "Username" },
              { key: "displayName", label: "Display Name" },
              { key: "role", label: "Role" },
              { key: "status", label: "Status" },
              { key: "createdAt", label: "Created" },
            ]}
            rows={users}
            actions={[
              { label: "Promote", onClick: (id) => handleAction("promote", id) },
              { label: "Suspend", onClick: (id) => handleAction("suspend", id) },
              { label: "Delete", onClick: (id) => handleAction("delete", id) },
            ]}
          />

          {users.map((u) => (
            <div key={u.id} className="mt-2 flex gap-2">
              <AdminBadge kind={u.role === "admin" ? "admin" : "user"}>{u.role}</AdminBadge>
              <AdminBadge kind={u.status === "active" ? "active" : "suspended"}>{u.status}</AdminBadge>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
