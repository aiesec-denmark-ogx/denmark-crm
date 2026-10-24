/**
 * Synapse mark — a hexagon-bound "S" built from two interlocking
 * chevron shapes, the two colors standing for two cells connecting.
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  const height = size;
  const width = Math.round(size * (296.47 / 323.42));

  return (
    <svg
      width={width}
      height={height}
      viewBox="1062.54 81.29 296.47 323.42"
      style={{ flexShrink: 0 }}
      className={className}
    >
      <path
        fill="var(--brand-blue)"
        d="M 1359.007812 152.210938 L 1210.773438 81.285156 L 1062.539062 152.210938 L 1089.15625 168.011719 L 1210.773438 109.820312 L 1332.386719 168.007812 L 1332.265625 199.144531 L 1359.007812 152.210938"
      />
      <path
        fill="var(--brand-blue)"
        d="M 1264.617188 268.648438 L 1211.53125 283.699219 L 1089.277344 218.179688 L 1089.15625 168.011719 L 1062.539062 152.242188 L 1062.539062 232.382812 L 1191.9375 302.839844 L 1216.730469 316.535156 L 1264.617188 268.648438"
      />
      <path
        fill="var(--brand-orange)"
        d="M 1210.773438 376.179688 L 1089.160156 317.992188 L 1089.285156 286.855469 L 1062.539062 333.789062 L 1210.773438 404.714844 L 1359.007812 333.789062 L 1332.390625 317.988281 L 1210.773438 376.179688"
      />
      <path
        fill="var(--brand-orange)"
        d="M 1204.816406 169.464844 L 1156.929688 217.351562 L 1210.019531 202.300781 L 1332.269531 267.820312 L 1332.390625 317.988281 L 1359.007812 333.757812 L 1359.007812 253.617188 L 1204.816406 169.464844"
      />
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
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} className={markClassName} />
      <span className={textClassName ?? 'font-display text-xl font-bold tracking-tight'}>
        Synapse
      </span>
    </span>
  );
}
