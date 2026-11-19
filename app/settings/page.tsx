"use client";
import { useState } from "react";
import { useLibraryStore } from "@/lib/store/libraryStore";
import { usePlayerStore } from "@/lib/store/playerStore";

export default function Settings() {
  const { preferences, setPreferences } = useLibraryStore();
  const setVolume = usePlayerStore((s) => s.setVolume);
  const setCrossfade = usePlayerStore((s) => s.setCrossfade);
  const setSleepTimer = usePlayerStore((s) => s.setSleepTimer);
  const setAudioQuality = usePlayerStore((s) => s.setAudioQuality);
  const [saved, setSaved] = useState(false);

  const update = (p: Partial<typeof preferences>) => {
    setPreferences(p);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl">
      <h1 className="font-display text-3xl font-bold">Settings</h1>

      <section className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-lg font-bold">Appearance</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm">Theme</span>
          <select value={preferences.theme} onChange={(e) => update({ theme: e.target.value as "dark" | "light" | "system" })} className="glass rounded-lg px-3 py-1.5 bg-transparent transition-transform duration-150 ease-out-custom active:scale-95">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Accent color</span>
          <input type="color" value={preferences.accent} onChange={(e) => update({ accent: e.target.value })} className="w-10 h-8 rounded cursor-pointer" />
        </div>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm">Reduced transparency</span>
          <input type="checkbox" checked={preferences.reducedTransparency} onChange={(e) => update({ reducedTransparency: e.target.checked })} />
        </label>
      </section>

      <section className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-lg font-bold">Playback</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm">Default volume</span>
          <input type="range" min={0} max={1} step={0.01} value={preferences.defaultVolume}
            onChange={(e) => { const v = Number(e.target.value); update({ defaultVolume: v }); setVolume(v); }}
            className="w-40 accent-violet-400" />
        </div>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm">Autoplay</span>
          <input type="checkbox" checked={preferences.autoplay} onChange={(e) => update({ autoplay: e.target.checked })} />
        </label>
        <div className="flex items-center justify-between">
          <span className="text-sm">Crossfade length (s)</span>
          <input type="range" min={0} max={30} step={1} value={preferences.crossfadeLength ?? 0}
            onChange={(e) => { const v = Number(e.target.value); update({ crossfadeLength: v }); setCrossfade(v); }}
            className="w-40 accent-violet-400" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Sleep timer</span>
          <select value={String(preferences.sleepTimerMinutes ?? 0)} onChange={(e) => {
            const v = Number(e.target.value);
            update({ sleepTimerMinutes: v });
            setSleepTimer(v);
          }} className="glass rounded-lg px-3 py-1.5 bg-transparent w-20 transition-transform duration-150 ease-out-custom active:scale-95">
            <option value="0">Off</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Audio quality</span>
          <select value={preferences.audioQuality ?? "standard"} onChange={(e) => {
            setAudioQuality(e.target.value as "standard" | "high" | "lossless");
            update({ audioQuality: e.target.value as "standard" | "high" | "lossless" });
          }} className="glass rounded-lg px-3 py-1.5 bg-transparent w-20 transition-transform duration-150 ease-out-custom active:scale-95">
            <option value="standard">Standard</option>
            <option value="high">High</option>
            <option value="lossless">Lossless</option>
          </select>
        </div>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm">Remember playback position</span>
          <input type="checkbox" checked={preferences.rememberPosition} onChange={(e) => update({ rememberPosition: e.target.checked })} />
        </label>
      </section>

      <section className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-lg font-bold">Lyrics</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm">Auto scroll</span>
          <input type="checkbox" checked={preferences.lyricsAutoScroll} onChange={(e) => update({ lyricsAutoScroll: e.target.checked })} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Font size</span>
          <select value={preferences.lyricsFontSize} onChange={(e) => update({ lyricsFontSize: e.target.value as "sm" | "md" | "lg" })} className="glass rounded-lg px-3 py-1.5 bg-transparent transition-transform duration-150 ease-out-custom active:scale-95">
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Sync offset (s)</span>
          <input type="number" step={0.1} value={preferences.lyricsOffset}
            onChange={(e) => update({ lyricsOffset: Number(e.target.value) })} className="glass rounded-lg px-3 py-1.5 bg-transparent w-20 transition-transform duration-150 ease-out-custom active:scale-95" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Default lyrics mode</span>
          <select value={preferences.lyricsMode} onChange={(e) => update({ lyricsMode: e.target.value as "compact" | "immersive" })} className="glass rounded-lg px-3 py-1.5 bg-transparent transition-transform duration-150 ease-out-custom active:scale-95">
            <option value="compact">Compact</option>
            <option value="immersive">Immersive</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Lyrics theme</span>
          <select value={preferences.lyricsTheme} onChange={(e) => update({ lyricsTheme: e.target.value as "default" | "minimal" | "highlight" | "karaoke" })} className="glass rounded-lg px-3 py-1.5 bg-transparent transition-transform duration-150 ease-out-custom active:scale-95">
            <option value="default">Default</option>
            <option value="minimal">Minimal</option>
            <option value="highlight">Highlight</option>
            <option value="karaoke">Karaoke</option>
          </select>
        </div>
      </section>

      <section className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-lg font-bold">Privacy</h2>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm">Private profile</span>
          <input type="checkbox" checked={preferences.privateProfile} onChange={(e) => update({ privateProfile: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm">Private playlists</span>
          <input type="checkbox" checked={preferences.privatePlaylists} onChange={(e) => update({ privatePlaylists: e.target.checked })} />
        </label>
      </section>

      <section className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-lg font-bold">Account</h2>
        <button className="w-full text-left px-4 py-3 glass rounded-xl hover:bg-white/10 text-sm transition-transform duration-150 ease-out-custom active:scale-95">Update email</button>
        <button className="w-full text-left px-4 py-3 glass rounded-xl hover:bg-white/10 text-sm transition-transform duration-150 ease-out-custom active:scale-95">Change password</button>
        <button className="w-full text-left px-4 py-3 glass rounded-xl hover:bg-red-500/10 text-sm text-red-400 transition-transform duration-150 ease-out-custom active:scale-95">Delete account</button>
      </section>

      {saved && <div className="text-xs text-accent">Saved</div>}
    </div>
  );
}