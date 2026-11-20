"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGuard from "@/components/layout/AdminGuard";
import { AdminTable } from "@/components/ui/AdminTable";
import { AdminBadge } from "@/components/ui/AdminBadge";
import { useLibraryStore } from "@/lib/store/libraryStore";
import type { User } from "@/lib/types";

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <AdminGuard>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted mt-1">Manage user accounts, roles, and access status.</p>
          </div>
          <Link href="/admin" className="px-4 py-2 rounded-lg glass hover:bg-white/10 transition">
            Back to Dashboard
          </Link>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-muted">Loading users...</p>
          </div>
        )}

        {!loading && error && (
          <div className="glass-raised rounded-2xl p-8 text-center">
            <p className="text-rose-400">{error}</p>
            <button
              onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
              className="mt-5 px-5 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-transform duration-150 ease-out-custom active:scale-95"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="text-muted">
              Server-side RBAC and admin API routes are fully enforced for all mutations.
            </p>

            <AdminTable
              columns={[
                { key: "email", label: "Email" },
                { key: "username", label: "Username" },
                { key: "displayName", label: "Display Name" },
                { key: "role", label: "Role", render: (v) => <AdminBadge kind={(v as string) === "admin" ? "admin" : "user"}>{v as string}</AdminBadge> },
                { key: "status", label: "Status", render: (v) => <AdminBadge kind={(v as string) === "active" ? "active" : "suspended"}>{v as string}</AdminBadge> },
                { key: "createdAt", label: "Created", render: (v) => new Date(v as string).toLocaleDateString() },
              ]}
              rows={users}
              actions={[
                { label: "Promote", onClick: (id) => handleAction("promote", id) },
                { label: "Suspend", onClick: (id) => handleAction("suspend", id) },
                { label: "Delete", onClick: (id) => handleAction("delete", id) },
              ]}
            />
          </>
        )}
      </div>
    </AdminGuard>
  );
}
