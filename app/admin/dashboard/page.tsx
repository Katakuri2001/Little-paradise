"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGuard from "@/components/layout/AdminGuard";
import { AdminStatCard } from "@/components/ui/AdminStatCard";
import { AdminTable } from "@/components/ui/AdminTable";
import { isAdminUser } from "@/lib/server/admin-helper";
import { useLibraryStore } from "@/lib/store/libraryStore";

export default function AdminDashboard() {
  const user = useLibraryStore((s) => s.user);
  const [stats, setStats] = useState<{ users: number; tracks: number; playlists: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isAdminUser(user)) return null;

  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load stats");
        const data = await res.json();
        if (!cancelled) setStats(data.stats);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
        <Link href="/" className="px-4 py-2 rounded-full bg-white text-black font-medium hover:scale-105 transition">
          Exit Admin
        </Link>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted">Loading...</p>
        </div>
      )}

      {!loading && !stats && error && (
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

      {!loading && stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminStatCard value={stats.users} label="Total Users" />
            <AdminStatCard value={stats.tracks} label="Total Tracks" />
            <AdminStatCard value={stats.playlists} label="Total Playlists" />
            <AdminStatCard value="—" label="Plays Today" />
          </div>

          <section className="glass rounded-2xl p-6">
            <h2 className="font-display text-xl font-bold mb-4">Recent Activity</h2>
            <p className="text-muted">Activity tracking is available via the Audit Log in the Analytics section.</p>
          </section>

          <section className="glass rounded-2xl p-6">
            <h2 className="font-display text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/admin/users" className="glass p-4 rounded-xl flex flex-col items-center justify-center hover:bg-white/10 transition">
                <span className="text-muted">👥</span>
                <span className="mt-2 font-medium">User Management</span>
              </Link>
              <Link href="/admin/tracks" className="glass p-4 rounded-xl flex flex-col items-center justify-center hover:bg-white/10 transition">
                <span className="text-muted">🎵</span>
                <span className="mt-2 font-medium">Track Management</span>
              </Link>
              <Link href="/admin/playlists" className="glass p-4 rounded-xl flex flex-col items-center justify-center hover:bg-white/10 transition">
                <span className="text-muted">📋</span>
                <span className="mt-2 font-medium">Playlist Management</span>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
