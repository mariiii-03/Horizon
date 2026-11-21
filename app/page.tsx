import Link from "next/link";

// Frontend — owner yet to be decided. Placeholder landing page.
const modules = [
  { href: "/solar-system", title: "Interactive Solar System" },
  { href: "/discoveries", title: "NASA Daily Discoveries" },
  { href: "/asteroids", title: "Asteroid Tracker" },
  { href: "/space-weather", title: "Space Weather" },
  { href: "/exoplanets", title: "Beyond Our Solar System" },
  { href: "/academy", title: "Space Academy" },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-16">
      <h1 className="text-5xl font-bold tracking-tight">Horizon</h1>
      <p className="mt-3 max-w-2xl opacity-70">
        Explore the Solar System and beyond with live data from NASA.
      </p>
      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {modules.map((m) => (
          <li key={m.href}>
            <Link
              href={m.href}
              className="block rounded-lg border border-current/15 px-4 py-3 hover:border-current/40"
            >
              {m.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
