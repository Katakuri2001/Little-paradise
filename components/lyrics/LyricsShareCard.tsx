"use client";
import React from "react";

const GRADIENTS = [
  "from-violet-600 via-fuchsia-500 to-sky-500",
  "from-indigo-600 via-violet-500 to-pink-500",
  "from-sky-600 via-cyan-500 to-teal-500",
  "from-rose-600 via-orange-500 to-amber-500",
  "from-emerald-600 via-teal-500 to-cyan-500",
  "from-purple-600 via-indigo-500 to-blue-500",
];

export default function LyricsShareCard({
  lines,
  track,
  artworkSeed = 1,
}: {
  lines: string[];
  track: { title: string; artist: string; album?: string };
  artworkSeed?: number;
}) {
  const gradient = GRADIENTS[(artworkSeed - 1) % GRADIENTS.length];
  return (
    <div className="w-80 max-w-xs rounded-2xl p-6 text-white shadow-2xl overflow-hidden relative">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`} />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-white font-bold text-xl">
            {track.title.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{track.title}</div>
            <div className="text-xs text-white/70">{track.artist}</div>
          </div>
        </div>
        <div className="space-y-2 text-lg leading-relaxed">
          {lines.map((line, i) => (
            <div key={i} className="text-white/90 italic">
              “{line}”
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between text-xs text-white/50">
          <span>Little Paradise</span>
          <span>Lyrics share card</span>
        </div>
      </div>
    </div>
  );
}
