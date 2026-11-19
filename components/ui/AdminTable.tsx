import { cn } from "@/lib/utils";

type Column = {
  key: string;
  label: string;
  className?: string;
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
      <div className={cn("glass rounded-2xl p-8 text-center", className)}>
        <p className="text-muted">No records found.</p>
      </div>
    );
  }

  return (
    <div className={cn("glass rounded-2xl overflow-hidden", className)}>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn("px-4 py-3 text-xs text-muted uppercase font-medium", col.className)}
              >
                {col.label}
              </th>
            ))}
            {actions && <th className="px-4 py-3 text-right"></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-white/5 hover:bg-white/3 transition">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm">
                  {String((row as Record<string, unknown>)[col.key] ?? "")}
                </td>
              ))}
              {actions && (
                <td className="px-4 py-3 text-right">
                  {actions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => action.onClick(row.id)}
                      className={cn(
                        "px-2 py-1 text-xs text-muted hover:text-white hover:bg-white/10 rounded",
                        action.className,
                      )}
                    >
                      {action.label}
                    </button>
                  ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
