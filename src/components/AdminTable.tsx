import type { ReactNode } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface AdminTableColumn<T> {
  key: string;
  label: string;
  /** If set, column header shows sort control and this key is passed to onSort */
  sortKey?: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  /** Set to true for actions column so cell clicks don't trigger onRowClick */
  noRowClick?: boolean;
}

export interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  /** Current sort column key (must match a column's sortKey) */
  sortKey?: string | null;
  sortDirection?: SortDirection;
  onSort?: (key: string, direction: SortDirection) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  /** Header background: 'teal' (default) or custom class */
  headerClassName?: string;
}

function SortIcon({ direction, active }: { direction: SortDirection | null; active: boolean }) {
  if (!active || !direction) {
    return (
      <span className="inline-block w-4 ml-1 opacity-70" aria-hidden>
        ↕
      </span>
    );
  }
  return (
    <span className="inline-block w-4 ml-1" aria-hidden>
      {direction === 'asc' ? '↑' : '↓'}
    </span>
  );
}

export function AdminTable<T>({
  columns,
  rows,
  keyExtractor,
  sortKey = null,
  sortDirection = 'asc',
  onSort,
  onRowClick,
  emptyMessage = 'No data',
  headerClassName = 'bg-teal-700/90 text-white border-b border-teal-600',
}: AdminTableProps<T>) {
  return (
    <div className="border border-daret-border rounded-xl overflow-hidden bg-daret-card">
      {rows.length === 0 ? (
        <div className="p-12 text-center text-daret-muted text-sm">{emptyMessage}</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${headerClassName}`}>
              {columns.map((col) => {
                const isSortable = col.sortKey && onSort;
                const active = sortKey === col.sortKey;
                const align = col.align ?? 'left';
                return (
                  <th
                    key={col.key}
                    className={`px-4 py-2.5 font-medium uppercase tracking-wide text-xs ${
                      align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
                    } ${isSortable ? 'cursor-pointer select-none hover:opacity-90' : ''}`}
                    onClick={
                      isSortable
                        ? () => onSort(col.sortKey!, active && sortDirection === 'asc' ? 'desc' : 'asc')
                        : undefined
                    }
                    role={isSortable ? 'button' : undefined}
                    aria-sort={isSortable && active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <span className="inline-flex items-center">
                      {col.label}
                      {col.sortKey && (
                        <SortIcon
                          direction={active ? sortDirection : null}
                          active={active}
                        />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={keyExtractor(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-daret-border/50 transition ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${index % 2 === 0 ? 'bg-daret-card' : 'bg-daret-dark/20'} hover:bg-daret-dark/40`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    onClick={col.noRowClick ? (e) => e.stopPropagation() : undefined}
                    className={`px-4 py-2.5 text-daret-fg ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
