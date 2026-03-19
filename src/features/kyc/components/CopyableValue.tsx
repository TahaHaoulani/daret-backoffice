import { useState } from 'react';

interface CopyableValueProps {
  value: string;
  onCopy?: () => void;
  children?: React.ReactNode;
  className?: string;
  /** If provided, show this as display text instead of value (e.g. masked). */
  display?: string;
}

export function CopyableValue({ value, onCopy, children, className = '', display }: CopyableValueProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onCopy?.();
    }
  }

  const text = display ?? value;
  const isEmpty = !value;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {children ?? <span className="text-daret-fg">{isEmpty ? '—' : text}</span>}
      {!isEmpty && (
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center w-6 h-6 rounded text-daret-muted hover:text-daret-green hover:bg-daret-green/10 transition-colors"
          title="Copy"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <span className="text-daret-green text-xs">✓</span>
          ) : (
            <CopyIcon />
          )}
        </button>
      )}
    </span>
  );
}

function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}
