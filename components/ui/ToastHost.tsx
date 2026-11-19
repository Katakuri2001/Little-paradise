"use client";
import { useToastStore } from "@/lib/store/toastStore";
import { motion } from "framer-motion";

export default function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  return (
    <div className="fixed bottom-24 lg:bottom-20 left-1/2 -translate-x-1/2 z-50 space-y-2 w-full max-w-sm px-4">
      {toasts.map((t) => (
        <motion.div
          key={t.id}
          layout
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="glass-strong px-4 py-3 flex items-center justify-between gap-3 text-sm border border-white/10 backdrop-filter backdrop-blur-md"
        >
          <span>{t.message}</span>
          {t.undo && (
            <button
              onClick={() => { t.undo?.(); remove(t.id); }}
              className="text-accent font-medium hover:text-white transition-colors duration-150 ease-out-custom active:scale-95"
            >
              Undo
            </button>
          )}
        </motion.div>
      ))}
    </div>
  );
}