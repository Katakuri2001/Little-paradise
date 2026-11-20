"use client";
import Link from "next/link";
import AdminGuard from "@/components/layout/AdminGuard";
import { isAdminUser } from "@/lib/server/admin-helper";
import { useLibraryStore } from "@/lib/store/libraryStore";

export default function AdminSettings() {
  const user = useLibraryStore((s) => s.user);

  if (!isAdminUser(user)) return null;

  const handleToggle = (key: string, value: string | number | boolean) => {
    // Placeholder: no server endpoints yet (Foundation & Security phase)
    console.log(`[placeholder] set app setting ${key} = ${value}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">App Settings</h1>
          <p className="text-muted mt-1">Configure global application settings and feature flags.</p>
        </div>
        <Link href="/admin" className="px-4 py-2 rounded-lg glass hover:bg-white/10 transition">
          Back to Dashboard
        </Link>
      </div>

      <p className="text-muted">
        Server-side settings management will be implemented in the Foundation & Security phase.
      </p>

      <section className="glass-raised rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-lg font-bold">Feature Flags</h2>
        </div>
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-sm">Open Registration</span>
          <input
            type="checkbox"
            defaultChecked
            className="accent-accent rounded"
            onChange={(e) => handleToggle("registration_open", e.target.checked)}
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-sm">Maintenance Mode</span>
          <input
            type="checkbox"
            className="accent-accent rounded"
            onChange={(e) => handleToggle("maintenance_mode", e.target.checked)}
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-sm">Demo Content Banner</span>
          <input
            type="checkbox"
            defaultChecked
            className="accent-accent rounded"
            onChange={(e) => handleToggle("demo_content_banner", e.target.checked)}
          />
        </label>
      </section>

      <section className="glass-raised rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-lg font-bold">Defaults</h2>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Default Crossfade (seconds)</span>
          <input
            type="number"
            defaultValue="0"
            min="0"
            max="30"
            step="1"
            className="w-20 glass rounded-lg px-3 py-1.5 text-sm focus-visible:ring-accent"
            onChange={(e) => handleToggle("default_crossfade", Number(e.target.value))}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Featured Mood</span>
          <input
            type="text"
            defaultValue="dreamy"
            className="w-32 glass rounded-lg px-3 py-1.5 text-sm focus-visible:ring-accent"
            onChange={(e) => handleToggle("featured_mood", e.target.value)}
          />
        </div>
      </section>
    </div>
  );
}
