import { cn } from "@/lib/utils";

export function AdminStatCard({
  value,
  label,
  trend,
}: {
  value: string | number;
  label: string;
  trend?: string;
}) {
  return (
    <div className="glass-raised p-5 group transition-transform duration-150 ease-out-custom hover:scale-[1.01]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-muted uppercase tracking-wider">{label}</div>
        {trend && (
          <span className={`text-xs font-medium ${trend.startsWith("+") ? "text-emerald-400" : "text-rose-400"}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="font-display text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
