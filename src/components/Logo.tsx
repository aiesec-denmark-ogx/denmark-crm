/**
 * Synapse mark — "Pulse": a signal spiking across, arriving at a node.
 * Not AIESEC's own logo. `tone="dark"` lightens the stroke for use on
 * the dark brand panel; default tone is for light backgrounds.
 */
export function LogoMark({
  size = 28,
  tone = 'light',
  className,
}: {
  size?: number;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const stroke = tone === 'dark' ? '#bfe0ff' : 'var(--brand-blue)';
  const width = Math.round(size * (40 / 28));

  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 40 28"
      fill="none"
      style={{ flexShrink: 0 }}
      className={className}
    >
      <path
        d="M2 14h6l2.5-8 4.5 18 3.5-14 2.5 4h12.5"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="34.5" cy="14" r="3" fill="var(--brand-orange)" />
    </svg>
  );
}

export function Logo({
  size = 28,
  tone = 'light',
  textClassName,
  markClassName,
}: {
  size?: number;
  tone?: 'light' | 'dark';
  textClassName?: string;
  markClassName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} tone={tone} className={markClassName} />
      <span className={textClassName ?? 'font-display text-xl font-bold tracking-tight'}>
        Synapse
      </span>
    </span>
  );
}
