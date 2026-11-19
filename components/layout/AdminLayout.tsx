"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu, X, LayoutDashboard, Users, Music,
  Disc, List, Settings as SettingsIcon, BarChart3, LogOut, ChevronLeft,
} from "lucide-react";
import PersistentPlayerBar from "@/components/layout/PersistentPlayerBar";
import ToastHost from "@/components/ui/ToastHost";

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/tracks", label: "Tracks", icon: Music },
  { href: "/admin/artists", label: "Artists & Albums", icon: Disc },
  { href: "/admin/playlists", label: "Playlists", icon: List },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("is-admin");
    return () => {
      document.documentElement.classList.remove("is-admin");
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950">
      {/* Mobile header with menu toggle */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 glass border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            className="p-2 rounded-lg text-muted hover:text-white hover:bg-white/5"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">LP</span>
            </div>
            <div className="hidden sm:flex flex-col">
              <div className="text-sm font-bold">Little Paradise</div>
              <div className="text-xs text-muted">Admin</div>
            </div>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 min-h-screen lg:pt-0">
        {/* Admin sidebar */}
        {!collapsed && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <aside
              className={`fixed inset-y-0 left-0 z-50 glass border-r border-white/10 w-64 flex flex-col transform transition-transform duration-200 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <Link href="/admin/dashboard" className="flex items-center gap-2">
                  <ChevronLeft size={18} className="text-muted" aria-hidden="true" />
                  <span className="text-sm font-medium">Back to Dashboard</span>
                </Link>
                <button
                  className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5"
                  onClick={() => {
                    setCollapsed(true);
                    setMobileOpen(false);
                  }}
                  aria-label="Collapse admin sidebar"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {ADMIN_NAV.map((n) => {
                  const Icon = n.icon;
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted hover:text-white hover:bg-white/5 transition text-sm"
                    >
                      <Icon size={18} />
                      <span>{n.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-white/10 space-y-1">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted hover:text-white hover:bg-white/5 transition text-sm"
                >
                  <LogOut size={18} />
                  <span>Exit Admin</span>
                </Link>
              </div>
            </aside>
          </>
        )}

        {/* Collapsed desktop rail */}
        {collapsed && (
          <aside className="hidden lg:flex flex-col w-16 shrink-0 glass border-r border-white/10 fixed inset-y-0 left-0 z-40">
            <div className="flex items-center justify-center p-3 border-b border-white/10">
              <button
                className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5"
                onClick={() => setCollapsed(false)}
                aria-label="Expand admin sidebar"
              >
                <Menu size={18} />
              </button>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
              {ADMIN_NAV.map((n) => {
                const Icon = n.icon;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="flex items-center justify-center px-2 py-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition"
                    title={n.label}
                  >
                    <Icon size={18} />
                  </Link>
                );
              })}
            </nav>

            <div className="p-2 border-t border-white/10">
              <Link
                href="/"
                className="flex items-center justify-center px-2 py-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition"
                title="Exit Admin"
              >
                <LogOut size={18} />
              </Link>
            </div>
          </aside>
        )}

        {/* Admin main content */}
        <main
          className={`flex-1 transition-all duration-200 ${collapsed ? "lg:ml-16" : "lg:ml-64"}`}
          id="admin-content"
        >
          <div className="min-h-screen pt-14 pb-32 p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      <PersistentPlayerBar />
      <ToastHost />
    </div>
  );
}
