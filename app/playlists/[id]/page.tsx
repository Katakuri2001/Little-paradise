"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Play, Trash2, ArrowLeft, Music2 } from "lucide-react";
import { useLibraryStore } from "@/lib/store/libraryStore";
import { useToastStore } from "@/lib/store/toastStore";
import { usePlayerStore } from "@/lib/store/playerStore";
import { TRACKS } from "@/lib/demo-data";
import type { Track } from "@/lib/types";
import Artwork from "@/components/ui/Artwork";
import { GlassPanel } from "@/components/ui/Glass";

export default function PlaylistDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { playlists, deletePlaylist, restorePlaylist, renamePlaylist, removeFromPlaylist } = useLibraryStore();
  const pushToast = useToastStore((s) => s.push);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const playlist = playlists.find((p) => p.id === id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(playlist?.name ?? "");

  if (!playlist) {
    return <div className="p-8 text-muted">Playlist not found. <button onClick={() => router.back()} className="text-accent">Go back</button></div>;
  }

  const tracks = playlist.trackIds.map((tid) => TRACKS.find((t) => t.id === tid)).filter(Boolean) as Track[];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-muted hover:text-white text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
        <Artwork seed={playlist.seed} size={160} />
        <div className="flex-1">
          {editing ? (
            <div className="flex gap-2 mb-2">
              <input value={name} onChange={(e) => setName(e.target.value)} className="bg-transparent border-b border-white/20 text-3xl font-display font-bold outline-none" autoFocus />
              <button onClick={() => { renamePlaylist(playlist.id, name); setEditing(false); }} className="text-accent text-sm">Save</button>
            </div>
          ) : (
            <h1 className="font-display text-3xl font-bold cursor-pointer" onClick={() => { setEditing(true); setName(playlist.name); }}>{playlist.name}</h1>
          )}
          <p className="text-muted text-sm mt-1">{playlist.description || "No description"}</p>
          <div className="text-xs text-muted mt-2">{tracks.length} tracks</div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => tracks.length && playTrack(tracks[0], tracks)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black font-medium hover:scale-105 transition">
              <Play size={14} /> Play
            </button>
            <button onClick={() => { const removed = deletePlaylist(playlist.id); router.push("/playlists"); if (removed) pushToast({ message: "Playlist deleted", undo: () => restorePlaylist(removed) }); }} className="px-4 py-2 rounded-full glass text-sm hover:bg-red-500/20">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        {tracks.length === 0 && (
          <div className="text-center text-muted py-12">
            <Music2 size={40} className="mx-auto mb-3 opacity-50" />
            This playlist is empty. Add songs from search or tracks.
          </div>
        )}
        {tracks.map((t: Track, i: number) => (
          <div key={t.id + i} className="glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/10">
            <span className="text-muted text-sm w-6">{i + 1}</span>
            <Artwork seed={t.artworkSeed} size={40} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{t.title}</div>
              <div className="text-xs text-muted truncate">{t.artist}</div>
            </div>
            <button onClick={() => playTrack(t, tracks)} className="p-1.5 hover:text-accent"><Play size={14}/></button>
            <button onClick={() => removeFromPlaylist(playlist.id, t.id)} className="p-1.5 hover:text-red-400"><Trash2 size={14}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
