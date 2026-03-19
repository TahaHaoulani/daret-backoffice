import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  sortKey?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  pagination?: {
    page: number;
    size: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  onRowClick,
  isLoading,
  emptyMessage = 'No data',
  pagination,
}: DataTableProps<T>) {
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.size) : 1;

  return (
    <div className="border border-daret-border rounded-xl overflow-hidden bg-daret-card">
      {isLoading ? (
        <div className="p-12 text-center text-daret-muted">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="p-12 text-center text-daret-muted">{emptyMessage}</div>
      ) : (
        <>
          <table className="w-full">
            <thead>
              <tr className="border-b border-daret-border bg-daret-dark/50 text-left text-sm text-daret-muted">
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 font-medium">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-daret-border/50 hover:bg-daret-border/10 ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-daret-muted">
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {pagination && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-daret-border">
              <p className="text-sm text-daret-muted">
                Page {pagination.page} of {totalPages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page <= 1}
                  className="rounded border border-daret-border px-3 py-1 text-sm text-daret-muted disabled:opacity-50 hover:bg-daret-border/10"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => pagination.onPageChange(Math.min(totalPages, pagination.page + 1))}
                  disabled={pagination.page >= totalPages}
                  className="rounded border border-daret-border px-3 py-1 text-sm text-daret-muted disabled:opacity-50 hover:bg-daret-border/10"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
