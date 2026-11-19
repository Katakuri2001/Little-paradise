import { cn } from "@/lib/utils";
export function GlassPanel({ children, className = "", strong = false }: { children: React.ReactNode; className?: string; strong?: boolean }) {
  return <div className={cn(strong ? "glass-strong" : "glass", "rounded-2xl", className)}>{children}</div>;
}
