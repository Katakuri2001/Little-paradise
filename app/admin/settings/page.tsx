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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">App Settings</h1>
        <Link href="/admin" className="px-4 py-2 rounded-full bg-white/10 text-muted hover:bg-white/20">
          Back to Dashboard
        </Link>
      </div>

      <p className="text-muted">
        App settings are placeholders. Server-side settings management will be implemented in the Foundation & Security phase.
      </p>

      <section className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-lg font-bold">Feature Flags</h2>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm">Open Registration</span>
          <input
            type="checkbox"
            defaultChecked
            onChange={(e) => handleToggle("registration_open", e.target.checked)}
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm">Maintenance Mode</span>
          <input
            type="checkbox"
            onChange={(e) => handleToggle("maintenance_mode", e.target.checked)}
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm">Demo Content Banner</span>
          <input
            type="checkbox"
            defaultChecked
            onChange={(e) => handleToggle("demo_content_banner", e.target.checked)}
          />
        </label>
      </section>

      <section className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-lg font-bold">Defaults</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm">Default Crossfade (seconds)</span>
          <input type="number" defaultValue="0" min="0" max="30" step="1" onChange={(e) => handleToggle("default_crossfade", Number(e.target.value))} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Featured Mood</span>
          <input type="text" defaultValue="dreamy" onChange={(e) => handleToggle("featured_mood", e.target.value)} />
        </div>
      </section>
    </div>
  );
}
