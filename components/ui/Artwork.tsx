"use client";
import { motion } from "framer-motion";

const GRADIENTS = [
  "from-violet-600 via-fuchsia-500 to-sky-500",
  "from-indigo-600 via-violet-500 to-pink-500",
  "from-sky-600 via-cyan-500 to-teal-500",
  "from-rose-600 via-orange-500 to-amber-500",
  "from-emerald-600 via-teal-500 to-cyan-500",
  "from-purple-600 via-indigo-500 to-blue-500",
  "from-amber-600 via-rose-500 to-pink-500",
  "from-cyan-600 via-blue-500 to-indigo-500",
];

export default function Artwork({ seed, size = 48, spinning = false, className = "" }: { seed: number; size?: number; spinning?: boolean; className?: string }) {
  const g = GRADIENTS[(seed - 1) % GRADIENTS.length];
  return (
    <div className={`relative rounded-2xl bg-gradient-to-br ${g} flex items-center justify-center shadow-lg overflow-hidden ${className}`} style={size>0 ? { width: size, height: size } : undefined}>
      <motion.div
        animate={spinning ? { rotate: 360 } : {}}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-3 rounded-full border border-white/20"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_60%)]" />
    </div>
  );
}