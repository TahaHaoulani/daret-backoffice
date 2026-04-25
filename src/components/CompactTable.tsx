import type { ReactNode } from 'react';

export interface CompactTableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
  /** If set and onSort is provided, header is clickable and uses this key for sorting */
  sortKey?: string;
}

interface CompactTableProps<T> {
  columns: CompactTableColumn<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T, e: React.MouseEvent) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  /** When true, show skeleton rows instead of loading text */
  skeletonRows?: number;
  /** Current sort field (matches column sortKey). Enables sortable headers when used with onSort. */
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (sortKey: string) => void;
}

function SortIcon({ order }: { order: 'asc' | 'desc' }) {
  return (
    <span className="ml-1 inline-flex shrink-0 text-daret-green" aria-hidden>
      {order === 'asc' ? (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </span>
  );
}

export function CompactTable<T>({
  columns,
  rows,
  keyExtractor,
  onRowClick,
  isLoading,
  emptyMessage = 'No data',
  skeletonRows = 5,
  sortBy,
  sortOrder = 'desc',
  onSort,
}: CompactTableProps<T>) {
  return (
    <div className="border border-daret-border rounded-xl overflow-hidden bg-daret-card">
      <table className="w-full">
        <thead>
          <tr className="border-b border-daret-border bg-daret-dark/50 text-left text-xs font-medium uppercase tracking-wide text-daret-muted">
            {columns.map((col) => (
              <th key={col.key} className={`px-3 py-2 ${col.className ?? ''}`}>
                {col.sortKey != null && onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort(col.sortKey!)}
                    className="inline-flex items-center hover:text-daret-fg focus:outline-none focus:ring-2 focus:ring-daret-green rounded"
                    aria-sort={sortBy === col.sortKey ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {col.label}
                    {sortBy === col.sortKey ? <SortIcon order={sortOrder} /> : (
                      <span className="ml-1 inline-flex shrink-0 opacity-40" aria-hidden>
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </span>
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading && skeletonRows > 0 ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={`skeleton-${i}`} className="border-b border-daret-border/50">
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2">
                    <span className="inline-block h-4 w-full max-w-[120px] rounded bg-daret-muted/20 animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-daret-muted text-sm">
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-daret-muted text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={
                  onRowClick
                    ? (e) => {
                        const node = e.target as Node | null;
                        const el = node?.nodeType === Node.TEXT_NODE ? (node.parentElement as HTMLElement | null) : (node as HTMLElement | null);
                        if (el?.closest('button, a, input, select, textarea, [data-stop-row-click]')) return;
                        onRowClick(row, e);
                      }
                    : undefined
                }
                onAuxClick={
                  onRowClick
                    ? (e) => {
                        if (e.button !== 1) return;
                        e.preventDefault();
                        onRowClick(row, e);
                      }
                    : undefined
                }
                className={`border-b border-daret-border/50 text-sm text-daret-muted hover:bg-daret-border/10 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-3 py-2 ${col.className ?? ''}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
