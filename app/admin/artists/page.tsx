"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGuard from "@/components/layout/AdminGuard";
import { AdminTable } from "@/components/ui/AdminTable";
import { isAdminUser } from "@/lib/server/admin-helper";
import { useLibraryStore } from "@/lib/store/libraryStore";

export default function AdminArtists() {
  const user = useLibraryStore((s) => s.user);
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isAdminUser(user)) return null;

  useEffect(() => {
    let cancelled = false;
    async function fetchArtists() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/artists", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load artists");
        const data = await res.json();
        if (!cancelled) setArtists(data.artists || []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchArtists();
    return () => { cancelled = true; };
  }, []);

  async function handleAction(action: "edit" | "delete", id: string) {
    if (!confirm(`Are you sure you want to ${action} this artist?`)) return;
    try {
      if (action === "delete") {
        const res = await fetch(`/api/admin/artists/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete artist");
      }
      setArtists(artists.filter((a) => a.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unknown error");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Artists & Albums</h1>
          <p className="text-muted mt-1">Manage artist profiles and album metadata.</p>
        </div>
        <Link href="/admin" className="px-4 py-2 rounded-lg glass hover:bg-white/10 transition">
          Back to Dashboard
        </Link>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted">Loading artists...</p>
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
              { key: "followers", label: "Followers", render: (v) => Number(v || 0).toLocaleString() },
              { key: "genre", label: "Genre" },
              { key: "tracks", label: "Tracks", render: (v) => Number(v || 0).toLocaleString() },
            ]}
            rows={artists}
            actions={[
              { label: "Edit", onClick: (id) => handleAction("edit", id) },
              { label: "Delete", onClick: (id) => handleAction("delete", id) },
            ]}
          />
        </>
      )}
    </div>
  );
}
