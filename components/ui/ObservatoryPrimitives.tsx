import type { ReactNode } from "react";

export function HeroHeader({
  eyebrow,
  titleTop,
  titleAccent,
  titleBottom,
  subtitle,
  rightSlot,
}: {
  eyebrow?: string;
  titleTop: string;
  titleAccent: string;
  titleBottom?: string;
  subtitle: string;
  rightSlot?: ReactNode;
}) {
  return (
    <section className="pt-10 pb-8 sm:pt-14 sm:pb-10">
      {eyebrow && (
        <div className="mb-3 font-mono text-[10px] tracking-[0.22em] text-[#8CB8FF] uppercase">
          {eyebrow}
        </div>
      )}
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-4xl font-light tracking-[0.06em] text-[#F1F5FB] uppercase sm:text-5xl md:text-[54px] md:leading-[1.02]">
            <span className="block">{titleTop}</span>
            <span className="block font-serif text-[1.06em] font-normal italic tracking-[0.04em] text-[#DFC99D]">
              {titleAccent}
            </span>
            {titleBottom && <span className="block">{titleBottom}</span>}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#94A1B3]">{subtitle}</p>
        </div>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>
    </section>
  );
}

export function TelemetryPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`observatory-panel rounded-md p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function SectionLabel({
  eyebrow,
  title,
  rightText,
}: {
  eyebrow: string;
  title: string;
  rightText?: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="font-mono text-[10px] tracking-[0.18em] text-[#7D8C9F] uppercase">
          {eyebrow}
        </div>
        <h2 className="mt-1 text-xl font-medium tracking-[0.02em] text-[#EFF4FC] sm:text-2xl">
          {title}
        </h2>
      </div>
      {rightText && (
        <span className="font-mono text-[10px] tracking-[0.16em] text-[#6E7E94] uppercase">
          {rightText}
        </span>
      )}
    </div>
  );
}

export function MetricCell({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded border border-white/[0.07] bg-[#070B13]/80 px-3.5 py-2.5">
      <div className="font-mono text-[9px] tracking-[0.15em] text-[#708096] uppercase">{label}</div>
      <div
        className={`mt-1 font-mono text-base font-semibold tabular-nums ${
          highlight ? "text-[#8CB8FF]" : "text-[#EDF2FA]"
        }`}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-[#7A879A]">{sub}</div>}
    </div>
  );
}

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "blue" | "gold" | "emerald" | "danger";
}) {
  const styles: Record<string, string> = {
    neutral: "border-white/15 bg-white/[0.05] text-[#C5D0E0]",
    blue: "border-[#8CB8FF]/35 bg-[#8CB8FF]/12 text-[#9EC4FF]",
    gold: "border-[#DFC99D]/40 bg-[#DFC99D]/12 text-[#E8D5AF]",
    emerald: "border-emerald-400/35 bg-emerald-400/12 text-emerald-300",
    danger: "border-rose-400/40 bg-rose-500/15 text-rose-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] uppercase ${styles[tone]}`}
    >
      {label}
    </span>
  );
}

export function ErrorBanner({
  title = "Telemetry Downlink Interrupted",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-md border border-rose-400/30 bg-rose-950/30 p-4 backdrop-blur-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.16em] text-rose-300 uppercase">
            {title}
          </div>
          <p className="mt-1 text-sm text-rose-100/90">{message}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 rounded border border-rose-300/30 bg-rose-400/15 px-3 py-1.5 font-mono text-[11px] tracking-[0.12em] text-rose-100 uppercase transition hover:bg-rose-400/25"
          >
            Retry Link
          </button>
        )}
      </div>
    </div>
  );
}

export function LoadingPanel({ lines = 3, height = "h-44" }: { lines?: number; height?: string }) {
  return (
    <div className={`observatory-panel animate-pulse rounded-md p-5 ${height}`}>
      <div className="h-3 w-32 rounded bg-white/10" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className="h-3 rounded bg-white/[0.06]"
            style={{ width: `${88 - idx * 14}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Crisp 2D visual planet orb with realistic terminator shading, bands, and optional rings. */
export function PlanetDisc({
  color,
  size = 64,
  hasRings = false,
  planetId,
  className = "",
}: {
  color: string;
  size?: number;
  hasRings?: boolean;
  planetId?: string;
  className?: string;
}) {
  const isGas = planetId === "jupiter" || planetId === "saturn";
  const isSun = planetId === "sun";
  const isEarth = planetId === "earth";

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: hasRings ? size * 1.55 : size, height: size }}
    >
      {/* Back ring half */}
      {hasRings && (
        <div
          className="pointer-events-none absolute rounded-[100%] border-2 border-[#DFC99D]/45"
          style={{
            width: size * 1.52,
            height: size * 0.42,
            transform: "rotate(-16deg)",
            boxShadow: `0 0 10px ${color}33`,
          }}
        />
      )}

      {/* Planet sphere */}
      <div
        className="relative overflow-hidden rounded-full"
        style={{
          width: size,
          height: size,
          background: isSun
            ? "radial-gradient(circle at 38% 35%, #FFF4C2 0%, #FDB813 48%, #D96B08 100%)"
            : `radial-gradient(circle at 32% 30%, ${color}FF 0%, ${color}CC 52%, #070B14 96%)`,
          boxShadow: isSun
            ? "0 0 36px rgba(253, 184, 19, 0.55)"
            : `inset -${Math.round(size * 0.22)}px -${Math.round(size * 0.14)}px ${Math.round(size * 0.35)}px rgba(2,4,10,0.82), 0 0 ${Math.round(size * 0.25)}px ${color}30`,
        }}
      >
        {isGas && (
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                "repeating-linear-gradient(170deg, transparent 0px, transparent 5px, rgba(40,20,5,0.35) 7px, rgba(255,245,225,0.22) 10px, transparent 13px)",
            }}
          />
        )}
        {isEarth && (
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(circle at 42% 45%, rgba(65,180,105,0.65) 0%, transparent 26%), radial-gradient(circle at 65% 60%, rgba(90,195,120,0.55) 0%, transparent 22%), radial-gradient(circle at 30% 25%, rgba(255,255,255,0.5) 0%, transparent 32%)",
            }}
          />
        )}
      </div>

      {/* Front ring highlight */}
      {hasRings && (
        <div
          className="pointer-events-none absolute rounded-[100%] border-b-2 border-[#EEDBB7]/75"
          style={{
            width: size * 1.52,
            height: size * 0.42,
            transform: "rotate(-16deg)",
            clipPath: "inset(48% 0 0 0)",
          }}
        />
      )}
    </div>
  );
}
