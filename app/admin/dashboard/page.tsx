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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted mt-1">Manage users, tracks, artists, playlists, and monitor system activity.</p>
        </div>
        <Link href="/" className="px-5 py-2 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-transform duration-150 ease-out-custom active:scale-95">
          Exit Admin
        </Link>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted">Loading dashboard data...</p>
        </div>
      )}

      {!loading && !stats && error && (
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

      {!loading && stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminStatCard value={stats.users} label="Total Users" trend="+12%" />
            <AdminStatCard value={stats.tracks} label="Total Tracks" trend="+8%" />
            <AdminStatCard value={stats.playlists} label="Total Playlists" trend="+5%" />
            <AdminStatCard value="—" label="Plays Today" />
          </div>

          <section className="glass-raised rounded-2xl p-6">
            <h2 className="font-display text-xl font-bold mb-4">Recent Activity</h2>
            <p className="text-muted">Activity tracking is available via the Audit Log in the Analytics section.</p>
          </section>

          <section className="glass-raised rounded-2xl p-6">
            <h2 className="font-display text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/admin/users" className="glass-raised p-5 rounded-xl flex flex-col items-center justify-center hover:bg-white/10 transition-transform duration-150 ease-out-custom group">
                <span className="text-2xl text-muted group-hover:text-accent transition-colors">👥</span>
                <span className="mt-3 font-medium">User Management</span>
                <span className="mt-1 text-xs text-muted">Manage user accounts & roles</span>
              </Link>
              <Link href="/admin/tracks" className="glass-raised p-5 rounded-xl flex flex-col items-center justify-center hover:bg-white/10 transition-transform duration-150 ease-out-custom group">
                <span className="text-2xl text-muted group-hover:text-accent transition-colors">🎵</span>
                <span className="mt-3 font-medium">Track Management</span>
                <span className="mt-1 text-xs text-muted">Manage catalog tracks</span>
              </Link>
              <Link href="/admin/playlists" className="glass-raised p-5 rounded-xl flex flex-col items-center justify-center hover:bg-white/10 transition-transform duration-150 ease-out-custom group">
                <span className="text-2xl text-muted group-hover:text-accent transition-colors">📋</span>
                <span className="mt-3 font-medium">Playlist Management</span>
                <span className="mt-1 text-xs text-muted">Curate public playlists</span>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
