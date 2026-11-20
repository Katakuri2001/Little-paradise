import { cn } from "@/lib/utils";

type Column = {
  key: string;
  label: string;
  className?: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
};

type RowAction = {
  label: string;
  onClick: (id: string) => void;
  className?: string;
};

export function AdminTable<T extends { id: string }>({
  columns,
  rows,
  actions,
  className,
}: {
  columns: Column[];
  rows: T[];
  actions?: RowAction[];
  className?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className={cn("glass-raised p-8 text-center", className)}>
        <p className="text-muted">No records found.</p>
      </div>
    );
  }

  return (
    <div className={cn("glass-raised overflow-hidden", className)}>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn("px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider", col.className)}
              >
                {col.label}
              </th>
            ))}
            {actions && <th className="px-4 py-3 text-right"></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-150 ease-out-custom">
              {columns.map((col) => {
                const value = (row as Record<string, unknown>)[col.key];
                const rendered = col.render ? col.render(value, row as Record<string, unknown>) : String(value ?? "");
                return (
                  <td key={col.key} className="px-4 py-3 text-sm">
                    {rendered}
                  </td>
                );
              })}
              {actions && (
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {actions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => action.onClick(row.id)}
                        className={cn(
                          "px-2.5 py-1 text-xs font-medium text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-150 ease-out-custom",
                          action.className,
                        )}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
