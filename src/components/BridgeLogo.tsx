type Props = {
  className?: string;
};

/** Bridge brand mark (official PNG). */
export function BridgeLogo({ className = 'h-6 w-6' }: Props) {
  return (
    <img
      src="/bridge-logo.png"
      alt=""
      className={`object-contain ${className}`}
      aria-hidden
      draggable={false}
    />
  );
}

export const BRIDGE_BRAND = {
  orange: '#F5874F',
  orangeHover: '#E87842',
  textOnOrange: '#1E1611',
} as const;

type ButtonProps = {
  onClick: () => void;
  label: string;
  className?: string;
  disabled?: boolean;
};

export function VerifyWithBridgeButton({ onClick, label, className = '', disabled }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-10 w-full inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-0 text-sm font-semibold transition-colors bg-[#F5874F] hover:bg-[#E87842] text-[#1E1611] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <BridgeLogo className="h-5 w-5 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
