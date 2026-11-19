"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Play } from "lucide-react";
import { usePlayerStore } from "@/lib/store/playerStore";
import type { Track } from "@/lib/types";
import { useLibraryStore } from "@/lib/store/libraryStore";
import { formatTime } from "@/lib/utils";

export default function QueueDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  const upcoming = queue.slice(queueIndex + 1);
  const previous = queue.slice(0, queueIndex);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 200, ease: "easeOut" }}
            className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
          <motion.aside
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", damping: 28 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 glass-strong z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="font-display font-bold text-lg">Queue</h2>
              <div className="flex gap-2">
                <button
                  onClick={clearQueue}
                  className="text-xs text-muted hover:text-white px-2 py-1 rounded-md transition-transform duration-150 ease-out-custom active:scale-95"
                >
                  Clear
                </button>
                <button onClick={onClose} className="p-1.5"><X size={18}/></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {currentTrack && (
                <section>
                  <div className="text-xs text-muted uppercase tracking-wider mb-2">Now Playing</div>
                  <QueueRow track={currentTrack} active />
                </section>
              )}
              {upcoming.length > 0 && (
                <section>
                  <div className="text-xs text-muted uppercase tracking-wider mb-2">Next Up</div>
                  <div className="space-y-1">
                    {upcoming.map((t, i) => (
                      <QueueRow key={t.id} track={t} index={queueIndex + 1 + i}
                        onPlay={() => { playTrack(t, queue); }}
                        onRemove={() => removeFromQueue(queueIndex + 1 + i)} />
                    ))}
                  </div>
                </section>
              )}
              {previous.length > 0 && (
                <section>
                  <div className="text-xs text-muted uppercase tracking-wider mb-2">Previously Played</div>
                  <div className="space-y-1 opacity-60">
                    {previous.map((t, i) => (
                      <QueueRow key={t.id} track={t} index={i} />
                    ))}
                  </div>
                </section>
              )}
              {queue.length === 0 && <div className="text-center text-muted py-10 text-sm">Queue is empty</div>}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function QueueRow({ track, active = false, index, onPlay, onRemove }: { track: Track; active?: boolean; index?: number; onPlay?: () => void; onRemove?: () => void }) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-150 ease-out-custom ${active ? "bg-white/10" : "hover:bg-white/5"}`}>
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{track.title}</div>
        <div className="text-xs text-muted truncate">{track.artist}</div>
      </div>
      <span className="text-xs text-muted tabular-nums">{formatTime(track.duration)}</span>
      {onPlay && <button onClick={onPlay} className="p-1 hover:text-accent transition-transform duration-150 ease-out-custom active:scale-95"><Play size={14}/></button>}
      {onRemove && <button onClick={onRemove} className="p-1 hover:text-red-400 transition-transform duration-150 ease-out-custom active:scale-95"><Trash2 size={14}/></button>}
    </div>
  );
}