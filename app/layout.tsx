import type { Metadata } from "next";
import { Cormorant_Garamond, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { ObservatoryFooter } from "@/components/ui/ObservatoryFooter";
import { SaturnOrbitalNav } from "@/components/ui/SaturnOrbitalNav";
import { StarfieldBackground } from "@/components/ui/StarfieldBackground";
import "./globals.css";

const spaceSans = Plus_Jakarta_Sans({
  variable: "--font-space-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const editorialSerif = Cormorant_Garamond({
  variable: "--font-editorial-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HORIZON // Deep Space Observatory & NASA Explorer",
  description:
    "Interactive 3D Solar System explorer, NASA daily discoveries, near-Earth asteroid tracking, space weather telemetry, exoplanet catalog, and Space Academy.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceSans.variable} ${editorialSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-transparent text-[#E8EDF5] selection:bg-[#8CB8FF]/30 selection:text-white"
      >
        <StarfieldBackground />
        <SaturnOrbitalNav />
        <div className="relative z-10 flex-1 flex flex-col pl-0 md:pl-14 lg:pl-20">{children}</div>
        <div className="relative z-10 pl-0 md:pl-14 lg:pl-20">
          <ObservatoryFooter />
        </div>
      </body>
    </html>
  );
}
