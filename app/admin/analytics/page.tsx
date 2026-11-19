"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGuard from "@/components/layout/AdminGuard";
import { AdminStatCard } from "@/components/ui/AdminStatCard";
import { AdminTable } from "@/components/ui/AdminTable";
import { isAdminUser } from "@/lib/server/admin-helper";
import { useLibraryStore } from "@/lib/store/libraryStore";

export default function AdminAnalytics() {
  const user = useLibraryStore((s) => s.user);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isAdminUser(user)) return null;

  useEffect(() => {
    let cancelled = false;
    async function fetchLogs() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/audit-log", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load audit log");
        const data = await res.json();
        if (!cancelled) setLogs(data.auditLog || []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLogs();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Analytics</h1>
        <Link href="/admin" className="px-4 py-2 rounded-full bg-white/10 text-muted hover:bg-white/20">
          Back to Dashboard
        </Link>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted">Loading analytics...</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AdminStatCard value={logs.length} label="Audit Log Entries" />
            <AdminStatCard value="—" label="Storage Used" />
            <AdminStatCard value="—" label="Cache Hit Rate" />
          </div>

          <section className="glass rounded-2xl p-6">
            <h2 className="font-display text-xl font-bold mb-4">Audit Log</h2>
            <AdminTable
              columns={[
                { key: "action", label: "Action" },
                { key: "target_type", label: "Target Type" },
                { key: "target_id", label: "Target ID" },
                { key: "created_at", label: "Created At" },
              ]}
              rows={logs}
            />
          </section>
        </>
      )}
    </div>
  );
}
