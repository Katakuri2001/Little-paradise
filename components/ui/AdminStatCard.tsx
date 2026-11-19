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
    <div className="glass rounded-2xl p-4">
      <div className="text-xs text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-display font-bold">{value}</div>
      {trend && <div className="text-xs text-accent mt-1">{trend}</div>}
    </div>
  );
}
