"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGuard from "@/components/layout/AdminGuard";
import { AdminStatCard } from "@/components/ui/AdminStatCard";
import { AdminTable } from "@/components/ui/AdminTable";
import { useLibraryStore } from "@/lib/store/libraryStore";

export default function AdminAnalytics() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <AdminGuard>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted mt-1">Monitor audit logs and system activity.</p>
          </div>
          <Link href="/admin" className="px-4 py-2 rounded-lg glass hover:bg-white/10 transition">
            Back to Dashboard
          </Link>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-muted">Loading analytics...</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AdminStatCard value={logs.length} label="Audit Log Entries" />
              <AdminStatCard value="—" label="Storage Used" />
              <AdminStatCard value="—" label="Cache Hit Rate" />
            </div>

            <section className="glass-raised rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold">Audit Log</h2>
              </div>
              <AdminTable
                columns={[
                  { key: "action", label: "Action" },
                  { key: "target_type", label: "Target Type" },
                  { key: "target_id", label: "Target ID" },
                  { key: "created_at", label: "Created At", render: (v) => new Date(v as string).toLocaleString() },
                ]}
                rows={logs}
              />
            </section>
          </>
        )}
      </div>
    </AdminGuard>
  );
}
