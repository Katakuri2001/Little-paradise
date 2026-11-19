import { create } from "zustand";

export type Toast = {
  id: string;
  message: string;
  undo?: () => void;
  duration?: number;
};

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => string;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, duration: 4000, ...t }] }));
    const toast = get().toasts.find((x) => x.id === id)!;
    setTimeout(() => get().remove(id), toast.duration ?? 4000);
    return id;
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));