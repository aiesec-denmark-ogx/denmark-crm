/**
 * Synapse mark — a small node network (three dendrites firing into a
 * central node), not AIESEC's own logo. Brand-blue nodes, one
 * brand-orange "spark" node for the signal.
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      style={{ flexShrink: 0 }}
      className={className}
    >
      <line x1="16" y1="16" x2="7" y2="7" stroke="var(--brand-blue)" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="16" x2="26" y2="9" stroke="var(--brand-blue)" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="16" x2="10" y2="26" stroke="var(--brand-blue)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="16" r="5" fill="var(--brand-blue)" />
      <circle cx="7" cy="7" r="3" fill="var(--brand-blue)" />
      <circle cx="26" cy="9" r="3" fill="var(--brand-orange)" />
      <circle cx="10" cy="26" r="3" fill="var(--brand-blue)" />
    </svg>
  );
}

export function Logo({
  size = 28,
  textClassName,
  markClassName,
}: {
  size?: number;
  textClassName?: string;
  markClassName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} className={markClassName} />
      <span className={textClassName ?? 'font-display text-xl font-bold tracking-tight'}>
        Synapse
      </span>
    </span>
  );
}
