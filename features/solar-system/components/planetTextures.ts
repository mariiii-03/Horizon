import * as THREE from "three";

const textureCache = new Map<string, THREE.CanvasTexture>();

function seededNoise(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function getPlanetTexture(planetId: string, baseColor: string): THREE.CanvasTexture {
  const cached = textureCache.get(planetId);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const rand = seededNoise(planetId.split("").reduce((a, c) => a + c.charCodeAt(0) * 31, 7));

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (planetId === "sun") {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#FFCC33");
    grad.addColorStop(0.5, "#FDB813");
    grad.addColorStop(1, "#F57C00");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 420; i++) {
      ctx.fillStyle = rand() > 0.5 ? "rgba(255,248,200,0.22)" : "rgba(210,75,0,0.2)";
      ctx.beginPath();
      ctx.arc(rand() * 512, rand() * 256, 2 + rand() * 14, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (planetId === "jupiter" || planetId === "saturn") {
    const bands =
      planetId === "jupiter"
        ? ["#D8B894", "#A86C42", "#E4CEAE", "#8C5230", "#C99A6B", "#7B4A2E", "#DFC6A6"]
        : ["#EADAB4", "#CBB07A", "#DFC99B", "#B3935B", "#E6D6B0", "#A68750"];
    let y = 0;
    while (y < 256) {
      const h = 8 + rand() * 18;
      ctx.fillStyle = bands[Math.floor(rand() * bands.length)];
      ctx.globalAlpha = 0.75;
      ctx.fillRect(0, y, 512, h);
      y += h;
    }
    ctx.globalAlpha = 1;
    if (planetId === "jupiter") {
      // Great Red Spot
      ctx.fillStyle = "#B8472A";
      ctx.beginPath();
      ctx.ellipse(320, 158, 28, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#E8B78E";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  } else if (planetId === "earth") {
    ctx.fillStyle = "#19489B";
    ctx.fillRect(0, 0, 512, 256);
    // Continents
    ctx.fillStyle = "#2F7A4D";
    for (let i = 0; i < 28; i++) {
      ctx.beginPath();
      ctx.ellipse(
        rand() * 512,
        40 + rand() * 176,
        14 + rand() * 38,
        10 + rand() * 24,
        rand() * Math.PI,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    // Polar caps
    ctx.fillStyle = "#E8F2FF";
    ctx.fillRect(0, 0, 512, 18);
    ctx.fillRect(0, 238, 512, 18);
    // Soft cloud wisps
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    for (let i = 0; i < 45; i++) {
      ctx.beginPath();
      ctx.ellipse(rand() * 512, rand() * 256, 20 + rand() * 50, 3 + rand() * 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (planetId === "mars") {
    ctx.fillStyle = "#B84314";
    ctx.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = rand() > 0.5 ? "rgba(75,24,8,0.28)" : "rgba(225,120,68,0.22)";
      ctx.beginPath();
      ctx.arc(rand() * 512, rand() * 256, 4 + rand() * 20, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(245,240,235,0.85)";
    ctx.fillRect(0, 0, 512, 12);
    ctx.fillRect(0, 244, 512, 12);
  } else if (planetId === "mercury") {
    ctx.fillStyle = "#8C8C8C";
    ctx.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 160; i++) {
      const cx = rand() * 512;
      const cy = rand() * 256;
      const r = 2 + rand() * 10;
      ctx.fillStyle = "rgba(55,55,60,0.45)";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(195,195,205,0.28)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  } else {
    // Venus, Uranus, Neptune atmospheric swirls
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
      ctx.fillRect(0, rand() * 256, 512, 6 + rand() * 16);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(planetId, texture);
  return texture;
}

export function getRingTexture(planetId: string): THREE.CanvasTexture {
  const key = `${planetId}-ring`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  if (planetId === "saturn") {
    grad.addColorStop(0.0, "rgba(210,185,140,0.05)");
    grad.addColorStop(0.18, "rgba(220,198,158,0.55)");
    grad.addColorStop(0.38, "rgba(235,216,180,0.85)");
    grad.addColorStop(0.46, "rgba(35,30,25,0.12)"); // Cassini division
    grad.addColorStop(0.55, "rgba(228,205,165,0.72)");
    grad.addColorStop(0.82, "rgba(198,176,138,0.45)");
    grad.addColorStop(1.0, "rgba(180,158,125,0.0)");
  } else {
    grad.addColorStop(0.0, "rgba(160,215,225,0.0)");
    grad.addColorStop(0.35, "rgba(160,215,225,0.32)");
    grad.addColorStop(0.75, "rgba(140,195,225,0.22)");
    grad.addColorStop(1.0, "rgba(140,195,225,0.0)");
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}
