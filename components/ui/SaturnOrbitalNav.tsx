"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  code: string;
  angleDeg: number;
  icon: (active: boolean) => React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/solar-system",
    label: "Interactive Solar System",
    shortLabel: "Solar System",
    code: "01",
    angleDeg: -68,
    icon: () => (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
        <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
      </svg>
    ),
  },
  {
    href: "/discoveries",
    label: "NASA Daily Discoveries",
    shortLabel: "NASA Journal",
    code: "02",
    angleDeg: -41,
    icon: () => (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <circle cx="9" cy="9.5" r="1.5" />
        <path d="M20 15l-4.5-4.5L7 19" />
      </svg>
    ),
  },
  {
    href: "/asteroids",
    label: "Asteroid Tracker",
    shortLabel: "Asteroids",
    code: "03",
    angleDeg: -14,
    icon: () => (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <circle cx="12" cy="12" r="8" strokeDasharray="3 2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M18.5 5.5l-4 4" />
      </svg>
    ),
  },
  {
    href: "/space-weather",
    label: "Space Weather",
    shortLabel: "Space Weather",
    code: "04",
    angleDeg: 14,
    icon: () => (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
      </svg>
    ),
  },
  {
    href: "/exoplanets",
    label: "Beyond Our Solar System",
    shortLabel: "Exoplanets",
    code: "05",
    angleDeg: 41,
    icon: () => (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <circle cx="12" cy="12" r="4.5" />
        <ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(-24 12 12)" />
      </svg>
    ),
  },
  {
    href: "/academy",
    label: "Space Academy",
    shortLabel: "Academy",
    code: "06",
    angleDeg: 68,
    icon: () => (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="M12 4L2 9l10 5 10-5-10-5z" />
        <path d="M6 11.5v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
      </svg>
    ),
  },
];

export function SaturnOrbitalNav() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isExpanded = hovered || pinned;
  const activeRoute = NAV_ITEMS.find((item) => pathname.startsWith(item.href));

  return (
    <>
      {/* Subtle Top Observatory Strip */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#05070C]/75 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6 md:pl-16 lg:pl-20">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-xs font-medium tracking-[0.22em] text-[#E8EDF5] uppercase transition hover:text-[#DFC99D]"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-[#8CB8FF] shadow-[0_0_8px_#8CB8FF]" />
              HORIZON
            </Link>
            <span className="hidden text-white/20 sm:inline">/</span>
            <span className="hidden font-mono text-[10px] tracking-[0.16em] text-[#8A97AA] uppercase sm:inline">
              {activeRoute
                ? `${activeRoute.code} // ${activeRoute.label}`
                : "00 // COMMAND OVERVIEW"}
            </span>
          </div>

          {/* Desktop concise telemetry links */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Observatory Modules">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] uppercase transition ${
                    active
                      ? "bg-[#8CB8FF]/15 text-[#8CB8FF] ring-1 ring-[#8CB8FF]/35"
                      : "text-[#8A97AA] hover:bg-white/[0.04] hover:text-[#E8EDF5]"
                  }`}
                >
                  {item.shortLabel}
                </Link>
              );
            })}
          </nav>

          {/* Mobile/Tablet Menu Button */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-[#E8EDF5] uppercase lg:hidden"
            aria-expanded={mobileOpen}
            aria-label="Toggle observatory navigation"
          >
            <span>{mobileOpen ? "Close" : "Modules"}</span>
            <span className="text-[#8CB8FF]">{mobileOpen ? "×" : "☰"}</span>
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="border-t border-white/[0.08] bg-[#070B13]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className={`rounded border px-3 py-2 text-xs transition ${
                  pathname === "/"
                    ? "border-[#DFC99D]/50 bg-[#DFC99D]/10 text-[#DFC99D]"
                    : "border-white/10 bg-white/[0.02] text-[#B8C2D1]"
                }`}
              >
                <div className="font-mono text-[9px] tracking-widest opacity-60">00 // HUB</div>
                <div className="mt-0.5 font-medium">Overview</div>
              </Link>
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded border px-3 py-2 text-xs transition ${
                      active
                        ? "border-[#8CB8FF]/50 bg-[#8CB8FF]/12 text-[#8CB8FF]"
                        : "border-white/10 bg-white/[0.02] text-[#B8C2D1]"
                    }`}
                  >
                    <div className="font-mono text-[9px] tracking-widest opacity-60">
                      {`${item.code} // MODULE`}
                    </div>
                    <div className="mt-0.5 font-medium">{item.shortLabel}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Signature Left-Edge Saturn Orbital Radial Navigation (matches prototypes 2 & 4) */}
      <aside
        className="fixed top-[20%] left-0 z-50 hidden h-[280px] w-[260px] pointer-events-none md:block"
        aria-label="Saturn Orbital Navigation"
      >
        <div
          className="relative h-full w-full"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => {
            setHovered(false);
            setHoveredItem(null);
          }}
        >
          {/* Glowing Orbital Arc when expanded */}
          <div
            className={`pointer-events-none absolute top-1/2 left-[-64px] h-[256px] w-[256px] -translate-y-1/2 rounded-full transition-all duration-500 ease-out ${
              isExpanded
                ? "scale-100 opacity-100 border border-[#DFC99D]/40 shadow-[0_0_38px_rgba(223,201,157,0.18),inset_0_0_24px_rgba(223,201,157,0.08)]"
                : "scale-75 opacity-0 border border-[#DFC99D]/10"
            }`}
          />
          <div
            className={`pointer-events-none absolute top-1/2 left-[-64px] h-[218px] w-[218px] -translate-y-1/2 rounded-full transition-all duration-500 ease-out ${
              isExpanded ? "scale-100 opacity-100 border border-white/[0.08]" : "scale-75 opacity-0"
            }`}
          />

          {/* Saturn Sphere Trigger (half-tucked at left edge, clicking returns home or pins ring) */}
          <div className="pointer-events-auto absolute top-1/2 left-[-66px] -translate-y-1/2">
            <button
              type="button"
              onClick={() => setPinned((p) => !p)}
              title={isExpanded ? "Collapse orbital menu" : "Expand Saturn orbital navigation"}
              aria-label="Toggle Saturn orbital navigation"
              aria-expanded={isExpanded}
              className="group relative flex h-[132px] w-[132px] cursor-pointer items-center justify-center rounded-full focus:outline-none"
            >
              {/* Saturn Outer Atmosphere Glow */}
              <span
                className={`absolute inset-1 rounded-full transition-all duration-500 ${
                  isExpanded
                    ? "shadow-[0_0_45px_rgba(223,201,157,0.45)]"
                    : "shadow-[0_0_24px_rgba(223,201,157,0.2)] group-hover:shadow-[0_0_36px_rgba(223,201,157,0.38)]"
                }`}
              />
              {/* Saturn Banded Sphere */}
              <span
                className="relative block h-[116px] w-[116px] overflow-hidden rounded-full border border-[#DFC99D]/25"
                style={{
                  background:
                    "linear-gradient(155deg, #F0DEC0 0%, #D9BC8C 22%, #B8945F 42%, #DEC396 58%, #A6824E 76%, #594429 94%)",
                  boxShadow:
                    "inset -26px -14px 32px rgba(4, 6, 12, 0.72), inset 8px 6px 18px rgba(255, 244, 220, 0.25)",
                }}
              >
                {/* Equatorial subtle cloud bands */}
                <span
                  className="absolute inset-0 opacity-45"
                  style={{
                    background:
                      "repeating-linear-gradient(165deg, transparent 0px, transparent 8px, rgba(95,68,36,0.32) 10px, rgba(255,240,210,0.18) 14px, transparent 18px)",
                  }}
                />
              </span>

              {/* Tilted Ring Accent */}
              <span
                className={`pointer-events-none absolute h-[38px] w-[170px] rounded-[100%] border-2 transition-all duration-500 ${
                  isExpanded
                    ? "border-[#DFC99D]/70 opacity-95"
                    : "border-[#DFC99D]/35 opacity-60 group-hover:opacity-90"
                }`}
                style={{
                  transform: "rotate(-18deg)",
                  boxShadow: "0 0 12px rgba(223, 201, 157, 0.2)",
                }}
              />

              {/* Subtle Home/Status Hint on hover */}
              <span className="pointer-events-none absolute right-2 font-mono text-[9px] tracking-[0.18em] text-[#05070C]/80 uppercase opacity-0 transition group-hover:opacity-100">
                NAV
              </span>
            </button>
          </div>

          {/* 6 Orbiting Module Nodes along the right-side arc */}
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const rad = (item.angleDeg * Math.PI) / 180;
            const radius = isExpanded ? 118 : 60;
            // Center of Saturn is at x = 0 (actually left-[-66px] + 66px = 0), y = 140
            const cx = Math.cos(rad) * radius;
            const cy = 140 + Math.sin(rad) * radius;

            return (
              <div
                key={item.href}
                className={`absolute transition-all duration-400 ease-out ${
                  isExpanded
                    ? "pointer-events-auto scale-100 opacity-100"
                    : "pointer-events-none scale-50 opacity-0"
                }`}
                style={{
                  left: `${cx - 18}px`,
                  top: `${cy - 18}px`,
                }}
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link
                  href={item.href}
                  aria-label={item.label}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-200 ${
                    active
                      ? "border-[#8CB8FF] bg-[#8CB8FF]/25 text-white shadow-[0_0_16px_rgba(140,184,255,0.5)]"
                      : "border-white/25 bg-[#0C121E]/90 text-[#DCE6F5] hover:scale-110 hover:border-[#DFC99D] hover:bg-[#DFC99D]/20 hover:text-[#DFC99D]"
                  }`}
                >
                  {item.icon(active)}
                </Link>

                {/* Tooltip Label */}
                {hoveredItem === item.href && (
                  <div className="pointer-events-none absolute top-1/2 left-11 -translate-y-1/2 whitespace-nowrap rounded border border-white/15 bg-[#0A0F1A]/95 px-2.5 py-1 shadow-xl backdrop-blur-md">
                    <span className="mr-1.5 font-mono text-[9px] text-[#8CB8FF]">{item.code}</span>
                    <span className="text-xs font-medium text-[#E8EDF5]">{item.label}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Home shortcut pill when expanded */}
          <div
            className={`absolute left-3 top-[248px] transition-all duration-300 ${
              isExpanded
                ? "pointer-events-auto translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-2 opacity-0"
            }`}
          >
            <Link
              href="/"
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] uppercase backdrop-blur-md transition ${
                pathname === "/"
                  ? "border-[#DFC99D]/60 bg-[#DFC99D]/15 text-[#DFC99D]"
                  : "border-white/15 bg-[#090D16]/90 text-[#9AA6B8] hover:border-white/35 hover:text-white"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Command Home
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
