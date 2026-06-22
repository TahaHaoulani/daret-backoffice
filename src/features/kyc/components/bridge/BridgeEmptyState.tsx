import type { ReactNode } from 'react';

type Props = {
  variant: 'neutral' | 'info' | 'warning' | 'danger';
  title: string;
  description?: string;
  icon?: ReactNode;
};

type VariantConfig = {
  shell: string;
  iconWrap: string;
};

/** Light-surface alerts with explicit dark text — readable in both light and dark app themes. */
const VARIANTS: Record<Props['variant'], VariantConfig> = {
  neutral: {
    shell: 'border-gray-200 bg-gray-50 border-l-gray-500',
    iconWrap: 'bg-gray-200 text-gray-700',
  },
  info: {
    shell: 'border-sky-200 bg-sky-50 border-l-sky-500',
    iconWrap: 'bg-sky-100 text-sky-700',
  },
  warning: {
    shell: 'border-amber-200 bg-amber-50 border-l-amber-500',
    iconWrap: 'bg-amber-100 text-amber-800',
  },
  danger: {
    shell: 'border-red-200 bg-red-50 border-l-red-500',
    iconWrap: 'bg-red-100 text-red-700',
  },
};

export function BridgeEmptyState({ variant, title, description, icon }: Props) {
  const styles = VARIANTS[variant];

  return (
    <div
      role="status"
      className={`rounded-xl border border-l-4 px-4 py-4 shadow-sm ${styles.shell}`}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.iconWrap}`}
            aria-hidden
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-semibold leading-snug text-gray-900">{title}</p>
          {description && (
            <p className="mt-1.5 text-sm leading-relaxed text-gray-700">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
