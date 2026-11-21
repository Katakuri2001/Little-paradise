"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGuard from "@/components/layout/AdminGuard";
import { AdminTable } from "@/components/ui/AdminTable";
import { AdminBadge } from "@/components/ui/AdminBadge";
import { useLibraryStore } from "@/lib/store/libraryStore";

export default function AdminTracks() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchTracks() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/tracks", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load tracks");
        const data = await res.json();
        if (!cancelled) setTracks(data.tracks || []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTracks();
    return () => { cancelled = true; };
  }, []);

  async function handleAction(action: "edit" | "unpublish" | "delete", id: string) {
    if (!confirm(`Are you sure you want to ${action} this track?`)) return;
    try {
      if (action === "edit") {
        const newTitle = prompt("Enter new track title:", tracks.find((t) => t.id === id)?.title ?? "");
        if (newTitle === null) return;
        if (!newTitle.trim()) { alert("Title cannot be empty"); return; }
        const res = await fetch(`/api/admin/tracks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle.trim() }),
        });
        if (!res.ok) throw new Error("Failed to edit track");
        setTracks(tracks.map((t) => t.id === id ? { ...t, title: newTitle.trim() } : t));
      } else if (action === "delete") {
        const res = await fetch(`/api/admin/tracks/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete track");
        setTracks(tracks.filter((t) => t.id !== id));
      } else if (action === "unpublish") {
        const res = await fetch(`/api/admin/tracks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "unpublished" }),
        });
        if (!res.ok) throw new Error("Failed to unpublish track");
        setTracks(tracks.map((t) => t.id === id ? { ...t, is_available: false } : t));
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unknown error");
    }
  }

  return (
    <AdminGuard>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Track Management</h1>
            <p className="text-muted mt-1">Manage catalog tracks, availability, and metadata.</p>
          </div>
          <Link href="/admin" className="px-4 py-2 rounded-lg glass hover:bg-white/10 transition">
            Back to Dashboard
          </Link>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-muted">Loading tracks...</p>
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
                { key: "title", label: "Title" },
                { key: "artist", label: "Artist" },
                { key: "album", label: "Album" },
                { key: "duration", label: "Duration", render: (v) => {
                  const s = Math.floor((v as number) || 0);
                  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
                }},
                { key: "genre", label: "Genre" },
                { key: "is_available", label: "Available", render: (v) => (
                  <AdminBadge kind={v ? "active" : "suspended"}>{v ? "Yes" : "No"}</AdminBadge>
                )},
              ]}
              rows={tracks}
              actions={[
                { label: "Edit", onClick: (id) => handleAction("edit", id) },
                { label: "Unpublish", onClick: (id) => handleAction("unpublish", id) },
                { label: "Delete", onClick: (id) => handleAction("delete", id) },
              ]}
            />
          </>
        )}
      </div>
    </AdminGuard>
  );
}
