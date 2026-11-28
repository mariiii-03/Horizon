"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  depth: number;
  baseAlpha: number;
  twinkleSpeed: number;
  phase: number;
  tint: string;
  rgb: string;
  hasFlare: boolean;
  driftX: number;
  driftY: number;
};

type ShootingStar = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number;
  maxLife: number;
  rgb: string;
};

type NebulaCloud = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  rgb: string;
  phase: number;
};

// Authentic stellar spectral classes (O/B blue-white, A/F pure white, G/K warm gold)
const SPECTRAL_TINTS = [
  { hex: "#FFFFFF", rgb: "255, 255, 255" },
  { hex: "#DCEAFF", rgb: "220, 234, 255" },
  { hex: "#B5D2FF", rgb: "181, 210, 255" },
  { hex: "#FFF4E0", rgb: "255, 244, 224" },
  { hex: "#F2F6FF", rgb: "242, 246, 255" },
  { hex: "#9EC2FF", rgb: "158, 194, 255" },
  { hex: "#FFE2B8", rgb: "255, 226, 184" },
];

/** Deterministic pseudo-random generator [0, 1) for stable sharp star distribution. */
function hash01(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453123;
  return s - Math.floor(s);
}

export function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ targetX: 0, targetY: 0, x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    let stars: Star[] = [];
    let clouds: NebulaCloud[] = [];
    let staticBackdrop: HTMLCanvasElement | null = null;
    const meteors: ShootingStar[] = [];
    let nextMeteorAt = performance.now() + 1800;

    const handlePointerMove = (e: PointerEvent) => {
      pointerRef.current.targetX = (e.clientX / Math.max(1, width) - 0.5) * 2;
      pointerRef.current.targetY = (e.clientY / Math.max(1, height) - 0.5) * 2;
    };

    const buildStaticHdLayer = () => {
      const off = document.createElement("canvas");
      off.width = Math.max(1920, Math.floor(width * dpr));
      off.height = Math.max(1080, Math.floor(height * dpr));
      const octx = off.getContext("2d");
      if (!octx) return null;

      const scaleX = off.width / Math.max(1, width);
      const scaleY = off.height / Math.max(1, height);
      octx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

      // Subtle Milky Way galactic band cloud glow matching the uploaded photo's steel-blue spine
      for (let i = 0; i < 42; i++) {
        const u = hash01(i * 3 + 11);
        const v = hash01(i * 3 + 29);
        // Bias clouds gently near the central spine (like cosmos-bg.jpg)
        const spineX = width * (0.5 + (u - 0.5) * 0.42 + (v - 0.5) * 0.14);
        const spineY = v * height;
        const radius = 85 + hash01(i * 5 + 7) * 190;
        const alpha = 0.025 + hash01(i * 7 + 3) * 0.038;

        const g = octx.createRadialGradient(spineX, spineY, 0, spineX, spineY, radius);
        g.addColorStop(0, `rgba(116, 154, 212, ${alpha})`);
        g.addColorStop(0.55, `rgba(56, 86, 134, ${alpha * 0.45})`);
        g.addColorStop(1, "rgba(10, 16, 28, 0)");
        octx.fillStyle = g;
        octx.beginPath();
        octx.arc(spineX, spineY, radius, 0, Math.PI * 2);
        octx.fill();
      }

      // 2,200 Full-HD pinpoint background stars (clustered slightly denser along the galactic band)
      const bgStarCount = 2200;
      for (let i = 0; i < bgStarCount; i++) {
        const rx1 = hash01(i * 11 + 1);
        const rx2 = hash01(i * 11 + 2);
        const ry = hash01(i * 11 + 3);
        const rm = hash01(i * 11 + 4);
        const rc = hash01(i * 11 + 5);

        // 55% concentrated smoothly around the Milky Way core, 45% uniform across sky
        const inBand = i % 20 < 11;
        const x = inBand
          ? width * (0.5 + (rx1 + rx2 - 1) * 0.34)
          : rx1 * width;
        const y = ry * height;

        // Razor-sharp sub-pixel to 1px pinpoints
        const r = rm > 0.94 ? 0.95 : rm > 0.65 ? 0.62 : 0.38;
        const alpha = 0.18 + rm * 0.68;
        const tint = SPECTRAL_TINTS[Math.floor(rc * SPECTRAL_TINTS.length)];

        octx.globalAlpha = alpha;
        octx.fillStyle = tint.hex;
        octx.beginPath();
        octx.arc(x, y, r, 0, Math.PI * 2);
        octx.fill();
      }
      octx.globalAlpha = 1;
      return off;
    };

    const buildScene = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      staticBackdrop = buildStaticHdLayer();

      // Foreground animated twinkling & parallax stars (up to 460 crisp animated stars)
      const starCount = Math.min(460, Math.max(260, Math.floor((width * height) / 3600)));
      stars = Array.from({ length: starCount }, (_, i) => {
        const r1 = hash01(i * 17 + 101);
        const r2 = hash01(i * 17 + 102);
        const r3 = hash01(i * 17 + 103);
        const r4 = hash01(i * 17 + 104);
        const depth = 0.3 + r3 * 0.9;
        const isBright = r3 > 0.89;
        const tintObj = SPECTRAL_TINTS[i % SPECTRAL_TINTS.length];
        return {
          x: r1 * width,
          y: r2 * height,
          r: isBright ? 1.35 + r4 * 0.45 : r3 > 0.55 ? 0.82 : 0.48,
          depth,
          baseAlpha: isBright ? 0.96 : 0.36 + r3 * 0.58,
          twinkleSpeed: 0.9 + r4 * 2.6,
          phase: r2 * Math.PI * 2,
          tint: tintObj.hex,
          rgb: tintObj.rgb,
          hasFlare: isBright,
          driftX: (r1 - 0.5) * (1.2 + depth * 1.8),
          driftY: (r2 - 0.5) * (0.8 + depth * 1.3),
        };
      });

      const cloudCount = Math.min(14, Math.max(8, Math.floor((width * height) / 110000)));
      clouds = Array.from({ length: cloudCount }, (_, i) => {
        const s1 = hash01(i * 23 + 301);
        const s2 = hash01(i * 23 + 302);
        return {
          x: s1 * width,
          y: s2 * height,
          r: 110 + s1 * 160,
          vx: (s1 - 0.5) * 5.2,
          vy: (s2 - 0.5) * 3.8,
          alpha: 0.025 + s2 * 0.022,
          rgb: i % 3 === 0 ? "130, 175, 255" : i % 3 === 1 ? "175, 202, 248" : "223, 201, 157",
          phase: s1 * Math.PI * 2,
        };
      });
    };

    const spawnMeteor = () => {
      const fromRight = Math.random() > 0.35;
      const startX = fromRight
        ? width * (0.35 + Math.random() * 0.6)
        : width * (0.05 + Math.random() * 0.5);
      const startY = height * (0.04 + Math.random() * 0.38);
      const angle = fromRight
        ? Math.PI * (0.68 + Math.random() * 0.14)
        : Math.PI * (0.18 + Math.random() * 0.14);
      const speed = 600 + Math.random() * 340;
      meteors.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 95 + Math.random() * 90,
        life: 0,
        maxLife: 0.62 + Math.random() * 0.42,
        rgb: Math.random() > 0.3 ? "182, 214, 255" : "255, 234, 196",
      });
    };

    buildScene();
    window.addEventListener("resize", buildScene);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    let last = performance.now();
    const start = last;

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - start) / 1000;

      const p = pointerRef.current;
      p.x += (p.targetX - p.x) * Math.min(1, dt * 4);
      p.y += (p.targetY - p.y) * Math.min(1, dt * 4);

      ctx.clearRect(0, 0, width, height);

      // 0. Draw Full-HD razor-sharp Milky Way pinpoint layer with subtle parallax
      if (staticBackdrop) {
        ctx.drawImage(staticBackdrop, -p.x * 5, -p.y * 5, width, height);
      }

      // 1. Drifting cosmic nebula mist
      for (const c of clouds) {
        c.x = (c.x + c.vx * dt + width) % width;
        c.y = (c.y + c.vy * dt + height) % height;
        const pulse = 0.78 + 0.22 * Math.sin(t * 0.4 + c.phase);
        const px = c.x - p.x * 11;
        const py = c.y - p.y * 11;

        const grad = ctx.createRadialGradient(px, py, 0, px, py, c.r);
        grad.addColorStop(0, `rgba(${c.rgb}, ${c.alpha * pulse})`);
        grad.addColorStop(1, `rgba(${c.rgb}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, c.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Crisp animated foreground twinkling stars & telescope diffraction spikes
      for (const s of stars) {
        s.x = (s.x + s.driftX * dt + width) % width;
        s.y = (s.y + s.driftY * dt + height) % height;

        const sx = s.x - p.x * 16 * s.depth;
        const sy = s.y - p.y * 16 * s.depth;

        const twinkle =
          0.46 +
          0.38 * Math.sin(t * s.twinkleSpeed + s.phase) +
          0.16 * Math.cos(t * s.twinkleSpeed * 1.9 + s.phase);
        const alpha = Math.max(0.1, Math.min(1, s.baseAlpha * twinkle));

        if (s.hasFlare) {
          const haloR = s.r * (3.6 + twinkle * 1.8);
          const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloR);
          halo.addColorStop(0, `rgba(${s.rgb}, ${alpha * 0.5})`);
          halo.addColorStop(1, `rgba(${s.rgb}, 0)`);
          ctx.globalAlpha = 1;
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.tint;
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fill();

        if (s.hasFlare) {
          const spikeLen = s.r * (4.2 + twinkle * 2.8);
          ctx.strokeStyle = s.tint;
          ctx.lineWidth = 0.65;
          ctx.globalAlpha = alpha * 0.65;
          ctx.beginPath();
          ctx.moveTo(sx - spikeLen, sy);
          ctx.lineTo(sx + spikeLen, sy);
          ctx.moveTo(sx, sy - spikeLen);
          ctx.lineTo(sx, sy + spikeLen);
          ctx.stroke();
        }
      }

      // 3. Dynamic shooting stars / meteors
      if (now >= nextMeteorAt) {
        spawnMeteor();
        nextMeteorAt = now + 2600 + Math.random() * 4200;
      }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.life += dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;

        if (m.life >= m.maxLife) {
          meteors.splice(i, 1);
          continue;
        }

        const progress = m.life / m.maxLife;
        const fade = Math.sin(progress * Math.PI);
        const norm = Math.hypot(m.vx, m.vy) || 1;
        const tailX = m.x - (m.vx / norm) * m.length;
        const tailY = m.y - (m.vy / norm) * m.length;

        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${0.96 * fade})`);
        grad.addColorStop(0.3, `rgba(${m.rgb}, ${0.55 * fade})`);
        grad.addColorStop(1, `rgba(${m.rgb}, 0)`);

        ctx.globalAlpha = 1;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * fade})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", buildScene);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#020408]"
    >
      {/* Uploaded Milky Way photo softened cleanly so its clouds/dust lanes shine without 576px star-pixelation */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/cosmos-bg.jpg"
        alt=""
        className="animate-cosmos-drift absolute inset-0 h-full w-full object-cover object-center opacity-65 blur-[2.5px] contrast-125 brightness-90 select-none"
      />
      {/* Full-HD HiDPI crisp starfield, Milky Way pinpoint clusters, diffraction spikes & meteors */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* Subtle perimeter vignette keeping cards & typography ultra-readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(2, 4, 8, 0.04) 0%, rgba(2, 4, 8, 0.42) 100%), linear-gradient(180deg, rgba(2,4,8,0.22) 0%, rgba(2,4,8,0.06) 50%, rgba(2,4,8,0.45) 100%)",
        }}
      />
    </div>
  );
}
