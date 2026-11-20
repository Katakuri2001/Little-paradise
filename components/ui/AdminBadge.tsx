import { cn } from "@/lib/utils";

export function AdminBadge({
  kind,
  children,
}: {
  kind: "admin" | "user" | "active" | "suspended" | "pending" | "archived";
  children: React.ReactNode;
}) {
  const base = "px-2.5 py-0.5 rounded-full text-xs font-medium";
  const variants: Record<string, string> = {
    admin: "bg-accent/20 text-accent border border-accent/30",
    user: "bg-white/10 text-muted border border-white/10",
    active: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    suspended: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
    pending: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    archived: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  };
  return <span className={cn(base, variants[kind])}>{children}</span>;
}
