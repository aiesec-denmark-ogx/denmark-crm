/**
 * Synapse logo — a single raster lockup (metallic ring mark + wordmark)
 * provided by the user, background removed. Not generated code: edit
 * /public/brand/synapse-logo.png to change the art itself.
 */
const ASPECT_RATIO = 484 / 111;

export function Logo({
  height = 28,
  pulse = false,
  className,
}: {
  height?: number;
  pulse?: boolean;
  className?: string;
}) {
  const width = Math.round(height * ASPECT_RATIO);

  return (
    <span className="relative inline-flex items-center" style={{ height }}>
      {pulse && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/brand/ekg-pulse.png"
          alt=""
          className="pointer-events-none absolute top-1/2 -left-[8%] h-[55%] w-[35%] -translate-y-1/2 object-cover opacity-90"
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/synapse-logo.png"
        alt="Synapse"
        width={width}
        height={height}
        className={className}
        style={{ height, width }}
      />
    </span>
  );
}
