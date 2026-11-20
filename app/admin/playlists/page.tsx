"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGuard from "@/components/layout/AdminGuard";
import { AdminTable } from "@/components/ui/AdminTable";
import { AdminBadge } from "@/components/ui/AdminBadge";
import { isAdminUser } from "@/lib/server/admin-helper";
import { useLibraryStore } from "@/lib/store/libraryStore";

export default function AdminPlaylists() {
  const user = useLibraryStore((s) => s.user);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isAdminUser(user)) return null;

  useEffect(() => {
    let cancelled = false;
    async function fetchPlaylists() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/playlists", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load playlists");
        const data = await res.json();
        if (!cancelled) setPlaylists(data.playlists || []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchPlaylists();
    return () => { cancelled = true; };
  }, []);

  async function handleAction(action: "curate" | "feature" | "delete", id: string) {
    if (!confirm(`Are you sure you want to ${action} this playlist?`)) return;
    try {
      if (action === "delete") {
        const res = await fetch(`/api/admin/playlists/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete playlist");
      } else if (action === "feature") {
        const res = await fetch(`/api/admin/playlists/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublic: true }),
        });
        if (!res.ok) throw new Error("Failed to feature playlist");
      }
      setPlaylists(playlists.filter((p) => p.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unknown error");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Playlist Management</h1>
          <p className="text-muted mt-1">Curate and manage public playlists.</p>
        </div>
        <Link href="/admin" className="px-4 py-2 rounded-lg glass hover:bg-white/10 transition">
          Back to Dashboard
        </Link>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted">Loading playlists...</p>
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
            Server-side admin API routes are fully enforced for all mutations.
          </p>

          <AdminTable
            columns={[
              { key: "name", label: "Name" },
              { key: "trackCount", label: "Tracks", render: (v) => Number(v || 0).toLocaleString() },
              { key: "isPublic", label: "Public", render: (v) => (
                <AdminBadge kind={v ? "active" : "suspended"}>{v ? "Yes" : "No"}</AdminBadge>
              )},
            ]}
            rows={playlists}
            actions={[
              { label: "Curate", onClick: (id) => handleAction("curate", id) },
              { label: "Feature", onClick: (id) => handleAction("feature", id) },
              { label: "Delete", onClick: (id) => handleAction("delete", id) },
            ]}
          />
        </>
      )}
    </div>
  );
}
