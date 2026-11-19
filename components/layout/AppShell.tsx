"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Compass, Search, Library, ListMusic, Heart, Clock, Mic2,
  User, Settings, Menu, X, Shield,
} from "lucide-react";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useLibraryStore } from "@/lib/store/libraryStore";
import { isAdminUser } from "@/lib/server/admin-helper";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import QueueDrawer from "@/components/player/QueueDrawer";
import ToastHost from "@/components/ui/ToastHost";
import PersistentPlayerBar from "@/components/layout/PersistentPlayerBar";
import MiniPlayer from "@/components/player/MiniPlayer";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: Library },
  { href: "/playlists", label: "Playlists", icon: ListMusic },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/recent", label: "Recently Played", icon: Clock },
  { href: "/lyrics", label: "Lyrics", icon: Mic2 },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNav, setMobileNav] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);

  const user = useLibraryStore((s) => s.user);
  const isAdmin = isAdminUser(user);
  const reducedTransparency = useLibraryStore((s) => s.preferences.reducedTransparency);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const prev = usePlayerStore((s) => s.prev);
  const next = usePlayerStore((s) => s.next);
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const muted = usePlayerStore((s) => s.muted);
  const setMuted = usePlayerStore((s) => s.setMuted);
  const setShuffle = usePlayerStore((s) => s.setShuffle);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const setRepeatMode = usePlayerStore((s) => s.setRepeatMode);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  useEffect(() => {
    document.documentElement.dataset.reducedTransparency = String(reducedTransparency);
  }, [reducedTransparency]);

  useKeyboardShortcuts({
    " ": () => togglePlay(),
    arrowleft: () => prev(),
    arrowright: () => next(),
    arrowup: () => setVolume(Math.min(1, volume + 0.1)),
    arrowdown: () => setVolume(Math.max(0, volume - 0.1)),
    n: () => next(),
    p: () => prev(),
    l: () => { /* toggle lyrics view handled in player page */ },
    s: () => setShuffle(!shuffle),
    r: () => setRepeatMode(repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off"),
    q: () => setQueueOpen(!queueOpen),
    "/": () => { /* focus search handled via navigation */ },
    "?": () => { /* shortcut help sheet */ },
    m: () => setMuted(!muted),
  });

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 glass border-r border-white/10 fixed inset-y-0 left-0 z-40">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center shadow-glow">
              <span className="text-white font-bold">LP</span>
            </div>
            <div>
              <div className="font-display font-bold text-lg leading-tight">Little Paradise</div>
              <div className="text-xs text-muted">Your little world of music</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = pathname === n.href;
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${active ? "bg-white/10 text-white" : "text-muted hover:text-white hover:bg-white/5"}`}>
                <Icon size={18} />
                <span className="text-sm font-medium">{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link href="/profile" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${pathname==="/profile"?"bg-white/10 text-white":"text-muted hover:text-white hover:bg-white/5"}`}>
            <User size={18}/><span className="text-sm font-medium">Profile</span>
          </Link>
          <Link href="/settings" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${pathname==="/settings"?"bg-white/10 text-white":"text-muted hover:text-white hover:bg-white/5"}`}>
            <Settings size={18}/><span className="text-sm font-medium">Settings</span>
          </Link>
          {isAdmin && (
            <Link href="/admin" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${pathname==="/admin"?"bg-white/10 text-white":"text-muted hover:text-white hover:bg-white/5"}`}>
              <Shield size={18}/><span className="text-sm font-medium">Admin</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 glass border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileNav(true)} className="p-2 rounded-lg hover:bg-white/5" aria-label="Open menu"><Menu size={20}/></button>
        <Link href="/" className="font-display font-bold">Little Paradise</Link>
        <Link href="/search" className="p-2 rounded-lg hover:bg-white/5" aria-label="Search"><Search size={20}/></Link>
      </header>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileNav && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 z-50 lg:hidden" onClick={() => setMobileNav(false)} />
            <motion.aside initial={{x:-280}} animate={{x:0}} exit={{x:-280}} transition={{type:"spring",damping:25}} className="fixed inset-y-0 left-0 w-72 glass z-50 lg:hidden p-4 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="font-display font-bold">Little Paradise</div>
                <button onClick={() => setMobileNav(false)} className="p-2"><X size={20}/></button>
              </div>
              <nav className="flex-1 space-y-1">
                {NAV.map((n) => {
                  const Icon = n.icon;
                  return (
                    <Link key={n.href} href={n.href} onClick={() => setMobileNav(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${pathname===n.href?"bg-white/10 text-white":"text-muted hover:text-white hover:bg-white/5"}`}>
                      <Icon size={18}/><span className="text-sm">{n.label}</span>
                    </Link>
                  );
                })}
                <Link href="/profile" onClick={() => setMobileNav(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted hover:text-white hover:bg-white/5"><User size={18}/><span className="text-sm">Profile</span></Link>
                <Link href="/settings" onClick={() => setMobileNav(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted hover:text-white hover:bg-white/5"><Settings size={18}/><span className="text-sm">Settings</span></Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setMobileNav(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted hover:text-white hover:bg-white/5"><Shield size={18}/><span className="text-sm">Admin</span></Link>
                )}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 pb-40 lg:pb-32 min-h-screen">
        {children}
      </main>

      <div className="lg:block hidden">
        <PersistentPlayerBar onQueueToggle={() => setQueueOpen(!queueOpen)} />
      </div>
      <div className="lg:hidden">
        <MiniPlayer />
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass border-t border-white/10 flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {[
          { href: "/", icon: Home, label: "Home" },
          { href: "/explore", icon: Compass, label: "Explore" },
          { href: "/search", icon: Search, label: "Search" },
          { href: "/library", icon: Library, label: "Library" },
          { href: "/favorites", icon: Heart, label: "Likes" },
        ].map((n) => {
          const Icon = n.icon;
          const active = pathname === n.href;
          return (
            <Link key={n.href} href={n.href} className={`flex flex-col items-center gap-0.5 px-2 py-1 ${active?"text-accent":"text-muted"}`}>
              <Icon size={18}/><span className="text-[9px]">{n.label}</span>
            </Link>
          );
        })}
      </nav>

      <QueueDrawer open={queueOpen} onClose={() => setQueueOpen(false)} />
      <ToastHost />
    </div>
  );
}
