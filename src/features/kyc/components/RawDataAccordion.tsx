import { useState } from 'react';

interface RawDataAccordionProps {
  data: unknown;
  defaultOpen?: boolean;
}

export function RawDataAccordion({ data, defaultOpen = false }: RawDataAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-daret-border rounded-xl overflow-hidden bg-daret-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-left text-sm font-medium text-daret-muted hover:text-daret-fg hover:bg-daret-border/10 transition"
      >
        <span>Raw data</span>
        <span className="text-daret-muted" aria-hidden>
          {open ? '▼' : '▶'}
        </span>
      </button>
      {open && (
        <div className="border-t border-daret-border p-4 bg-daret-dark/50">
          <pre className="text-xs text-gray-400 overflow-auto rounded-lg p-4 max-h-96 font-mono whitespace-pre-wrap break-words">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
