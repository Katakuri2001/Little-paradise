"use client";
import Link from "next/link";
import { useState } from "react";
import { Plus, Music2 } from "lucide-react";
import { useLibraryStore } from "@/lib/store/libraryStore";
import { TRACKS } from "@/lib/demo-data";
import Artwork from "@/components/ui/Artwork";
import { GlassPanel } from "@/components/ui/Glass";

export default function Playlists() {
  const { playlists, createPlaylist } = useLibraryStore();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    createPlaylist(name.trim());
    setName("");
    setCreating(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Playlists</h1>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-medium hover:scale-105 transition">
          <Plus size={16} /> New Playlist
        </button>
      </div>

      {creating && (
        <GlassPanel className="p-4 flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Playlist name" className="flex-1 bg-transparent outline-none" autoFocus />
          <button onClick={handleCreate} className="px-4 py-1.5 rounded-full bg-accent text-white text-sm">Create</button>
          <button onClick={() => setCreating(false)} className="px-4 py-1.5 rounded-full glass text-sm">Cancel</button>
        </GlassPanel>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {playlists.map((p) => (
          <Link key={p.id} href={`/playlists/${p.id}`}>
            <GlassPanel className="p-3 hover:bg-white/10 transition">
              <Artwork seed={p.seed} size={0} className="w-full aspect-square mb-3 rounded-xl" />
              <div className="font-medium text-sm truncate">{p.name}</div>
              <div className="text-xs text-muted truncate">{p.description || "No description"}</div>
              <div className="text-xs text-muted mt-1">{p.trackIds.length} tracks</div>
            </GlassPanel>
          </Link>
        ))}
      </div>
      {playlists.length === 0 && (
        <div className="text-center text-muted py-12">
          <Music2 size={40} className="mx-auto mb-3 opacity-50" />
          No playlists yet. Create your first one.
        </div>
      )}
    </div>
  );
}
