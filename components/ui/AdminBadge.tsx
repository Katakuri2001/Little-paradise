import { cn } from "@/lib/utils";

export function AdminBadge({
  kind,
  children,
}: {
  kind: "admin" | "user" | "active" | "suspended";
  children: React.ReactNode;
}) {
  const base = "px-2 py-0.5 rounded text-xs font-medium";
  const variants: Record<string, string> = {
    admin: "bg-accent/20 text-accent",
    user: "bg-white/10 text-muted",
    active: "bg-emerald-500/20 text-emerald-400",
    suspended: "bg-rose-500/20 text-rose-400",
  };
  return <span className={cn(base, variants[kind])}>{children}</span>;
}
