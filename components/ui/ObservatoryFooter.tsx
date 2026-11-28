import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/solar-system", label: "Solar System" },
  { href: "/discoveries", label: "NASA Journal" },
  { href: "/asteroids", label: "Asteroids" },
  { href: "/space-weather", label: "Space Weather" },
  { href: "/exoplanets", label: "Exoplanets" },
  { href: "/academy", label: "Academy" },
];

export function ObservatoryFooter() {
  return (
    <footer className="mt-20 border-t border-white/[0.08] bg-[#04060A]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <div className="font-mono text-[11px] font-semibold tracking-[0.18em] text-[#D8E1EE] uppercase">
            HORIZON OBSERVATORY CONSORTIUM
          </div>
          <p className="mt-1 font-mono text-[10px] tracking-[0.06em] text-[#6D7B8F]">
            Autonomous telemetry feed calibrated to NASA Open APIs &amp; IAU standards.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Footer Navigation">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-[#7D8B9E] transition hover:text-[#DFC99D]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
