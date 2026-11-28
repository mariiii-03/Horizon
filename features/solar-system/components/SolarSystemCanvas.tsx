"use client";

import { OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Planet } from "@/types/planet";
import { getPlanetTexture, getRingTexture } from "./planetTextures";

type ScaleMode = "observatory" | "proportional";

type SolarSystemCanvasProps = {
  planets: Planet[];
  selectedPlanetId: string;
  onSelectPlanet: (id: string) => void;
  paused?: boolean;
  speedMultiplier?: number;
  showOrbits?: boolean;
  showLabels?: boolean;
  scaleMode?: ScaleMode;
  compact?: boolean;
  focusTrigger?: number;
};

/**
 * NASA JPL J2000 orbital orientation elements (degrees):
 * - omegaBar: longitude of perihelion (ϖ)
 * - node: longitude of ascending node (Ω)
 * - meanLon: mean longitude at J2000 epoch (L0)
 */
const J2000_ANGLES: Record<string, { omegaBar: number; node: number; meanLon: number }> = {
  mercury: { omegaBar: 77.46, node: 48.33, meanLon: 252.25 },
  venus: { omegaBar: 131.53, node: 76.68, meanLon: 181.98 },
  earth: { omegaBar: 102.94, node: 0.0, meanLon: 100.46 },
  mars: { omegaBar: 336.04, node: 49.56, meanLon: 355.45 },
  jupiter: { omegaBar: 14.75, node: 100.56, meanLon: 34.4 },
  saturn: { omegaBar: 92.43, node: 113.72, meanLon: 49.94 },
  uranus: { omegaBar: 170.96, node: 74.23, meanLon: 313.23 },
  neptune: { omegaBar: 44.97, node: 131.72, meanLon: 304.88 },
};

/** Map real AU distance onto 3D scene units. */
function getOrbitSemiMajorAxis(au: number, scaleMode: ScaleMode): number {
  if (scaleMode === "proportional") {
    // True linear AU proportions so inner rocky cluster vs outer giants is astronomically accurate
    return 3.2 + au * 3.8;
  }
  // Smooth non-linear spacing so inner rocky planets aren't crushed into the Sun
  return 4.8 + Math.pow(au, 0.56) * 11.2;
}

/** Solve Kepler's Equation M = E - e * sin(E) via Newton-Raphson. */
function solveEccentricAnomaly(meanAnomaly: number, e: number): number {
  let E = meanAnomaly;
  for (let i = 0; i < 4; i++) {
    const f = E - e * Math.sin(E) - meanAnomaly;
    const fp = 1 - e * Math.cos(E);
    E -= f / Math.max(1e-6, fp);
  }
  return E;
}

/** Compute 3D heliocentric position in scene coordinates from real Keplerian orbital elements. */
function computeKeplerPosition(
  planet: Planet,
  eccentricAnomaly: number,
  scaleMode: ScaleMode,
  out: THREE.Vector3,
): THREE.Vector3 {
  if (!planet.orbit) return out.set(0, 0, 0);

  const a = getOrbitSemiMajorAxis(planet.orbit.semiMajorAxisAu, scaleMode);
  const e = planet.orbit.eccentricity;
  const incRad = THREE.MathUtils.degToRad(planet.orbit.inclinationDeg);

  const elem = J2000_ANGLES[planet.id] ?? { omegaBar: 0, node: 0, meanLon: 0 };
  const nodeRad = THREE.MathUtils.degToRad(elem.node);
  const argPeriRad = THREE.MathUtils.degToRad(elem.omegaBar - elem.node);

  // Position in orbital plane (perihelion along +xOrb)
  const xOrb = a * (Math.cos(eccentricAnomaly) - e);
  const zOrb = a * Math.sqrt(1 - e * e) * Math.sin(eccentricAnomaly);

  // Rotate by argument of perihelion (ω) in orbital plane
  const cosW = Math.cos(argPeriRad);
  const sinW = Math.sin(argPeriRad);
  const x1 = xOrb * cosW - zOrb * sinW;
  const z1 = xOrb * sinW + zOrb * cosW;

  // Tilt by true orbital inclination (i) around ascending node line
  const y2 = z1 * Math.sin(incRad);
  const z2 = z1 * Math.cos(incRad);

  // Rotate by longitude of ascending node (Ω) around ecliptic north (+Y)
  const cosN = Math.cos(nodeRad);
  const sinN = Math.sin(nodeRad);
  const x = x1 * cosN - z2 * sinN;
  const z = x1 * sinN + z2 * cosN;

  return out.set(x, y2, z);
}

/** Map planet radius onto a visible 3D sphere radius. */
function getVisualRadius(planet: Planet, mode: ScaleMode): number {
  if (planet.id === "sun") {
    return mode === "proportional" ? 2.4 : 2.35;
  }
  if (mode === "proportional") {
    return Math.max(0.2, Math.pow(planet.radiusKm / 6371, 0.55) * 0.55);
  }
  const map: Record<string, number> = {
    mercury: 0.34,
    venus: 0.54,
    earth: 0.58,
    mars: 0.42,
    jupiter: 1.42,
    saturn: 1.18,
    uranus: 0.84,
    neptune: 0.8,
  };
  return map[planet.id] ?? 0.58;
}

function AsteroidBelt({ scaleMode }: { scaleMode: ScaleMode }) {
  const geometry = useMemo(() => {
    const count = 900;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const seed1 = ((i * 9301 + 49297) % 233280) / 233280;
      const seed2 = ((i * 7919 + 12347) % 233280) / 233280;
      const seed3 = ((i * 4253 + 98711) % 233280) / 233280;
      // Main belt spans ~2.15 AU to 3.25 AU (between Mars 1.52 AU and Jupiter 5.20 AU)
      const au = 2.15 + seed1 * 1.1;
      const r = getOrbitSemiMajorAxis(au, scaleMode);
      const angle = seed2 * Math.PI * 2;
      const y = (seed3 - 0.5) * 0.65;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [scaleMode]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <points geometry={geometry}>
      <pointsMaterial color="#6D7D94" size={0.11} transparent opacity={0.45} sizeAttenuation />
    </points>
  );
}

function OrbitPath({
  planet,
  selected,
  scaleMode,
}: {
  planet: Planet;
  selected: boolean;
  scaleMode: ScaleMode;
}) {
  const lineObject = useMemo(() => {
    if (!planet.orbit) return null;

    const points: THREE.Vector3[] = [];
    const segments = 160;
    const tmp = new THREE.Vector3();
    for (let i = 0; i <= segments; i++) {
      const E = (i / segments) * Math.PI * 2;
      computeKeplerPosition(planet, E, scaleMode, tmp);
      points.push(tmp.clone());
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: selected ? "#8CB8FF" : "#44546B",
      transparent: true,
      opacity: selected ? 0.85 : 0.34,
    });
    return new THREE.Line(geometry, material);
  }, [planet, selected, scaleMode]);

  useEffect(() => {
    return () => {
      if (lineObject) {
        lineObject.geometry.dispose();
        (lineObject.material as THREE.Material).dispose();
      }
    };
  }, [lineObject]);

  if (!lineObject) return null;
  return <primitive object={lineObject} />;
}

function PlanetLabelSprite({
  name,
  selected,
  yOffset,
}: {
  name: string;
  selected: boolean;
  yOffset: number;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const label = name.toUpperCase();
      ctx.font = "600 22px monospace";
      const textWidth = ctx.measureText(label).width;
      const boxWidth = Math.min(240, Math.max(96, textWidth + 36));
      const boxX = (canvas.width - boxWidth) / 2;
      const boxY = 12;
      const boxH = 40;

      ctx.fillStyle = selected ? "rgba(10, 19, 36, 0.9)" : "rgba(5, 7, 12, 0.72)";
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxWidth, boxH, 8);
      ctx.fill();

      ctx.strokeStyle = selected ? "rgba(140, 184, 255, 0.75)" : "rgba(255, 255, 255, 0.16)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = selected ? "#8CB8FF" : "#C4D0E0";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, canvas.width / 2, boxY + boxH / 2 + 1);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [name, selected]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  return (
    <sprite position={[0, yOffset, 0]} scale={[3.4, 0.85, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} />
    </sprite>
  );
}

function PlanetMesh({
  planet,
  selected,
  paused,
  speedMultiplier,
  showLabels,
  scaleMode,
  onSelect,
  positionsRef,
}: {
  planet: Planet;
  selected: boolean;
  paused: boolean;
  speedMultiplier: number;
  showLabels: boolean;
  scaleMode: ScaleMode;
  onSelect: (id: string) => void;
  positionsRef: React.MutableRefObject<Record<string, THREE.Vector3>>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const meanAnomalyRef = useRef(
    (() => {
      const elem = J2000_ANGLES[planet.id];
      return elem ? THREE.MathUtils.degToRad(elem.meanLon - elem.omegaBar) : planet.order * 1.18;
    })(),
  );
  const tmpVec = useMemo(() => new THREE.Vector3(), []);

  const radius = getVisualRadius(planet, scaleMode);
  const texture = useMemo(() => getPlanetTexture(planet.id, planet.color), [planet.id, planet.color]);
  const ringTexture = useMemo(
    () => (planet.id === "saturn" || planet.id === "uranus" ? getRingTexture(planet.id) : null),
    [planet.id],
  );

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    if (!paused && planet.orbit) {
      // Exact Keplerian angular rate: 1 Earth year (365.2 days) = ~18s at 1x speed
      const daysPerSecond = 20 * speedMultiplier;
      const meanMotion = (Math.PI * 2) / planet.orbit.periodDays;
      meanAnomalyRef.current += meanMotion * daysPerSecond * delta;
    }

    if (groupRef.current) {
      if (planet.orbit) {
        const E = solveEccentricAnomaly(meanAnomalyRef.current, planet.orbit.eccentricity);
        computeKeplerPosition(planet, E, scaleMode, tmpVec);
        groupRef.current.position.copy(tmpVec);
        positionsRef.current[planet.id] = tmpVec.clone();
      } else {
        positionsRef.current[planet.id] = new THREE.Vector3(0, 0, 0);
      }
    }

    if (sphereRef.current && !paused) {
      const dir = planet.rotationHours < 0 ? -1 : 1;
      const spinRate = Math.min(2.2, 24 / Math.max(8, Math.abs(planet.rotationHours)));
      sphereRef.current.rotation.y += dir * spinRate * 0.35 * speedMultiplier * delta;
    }
  });

  const tiltRad = THREE.MathUtils.degToRad(planet.axialTiltDeg);

  return (
    <group ref={groupRef}>
      {/* Selection Halo */}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.45, radius * 1.56, 48]} />
          <meshBasicMaterial color="#8CB8FF" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
      )}

      <group rotation={[0, 0, tiltRad]}>
        <mesh
          ref={sphereRef}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(planet.id);
          }}
          onPointerOver={() => {
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto";
          }}
        >
          <sphereGeometry args={[radius, 40, 40]} />
          {planet.id === "sun" ? (
            <meshBasicMaterial map={texture} />
          ) : (
            <meshStandardMaterial map={texture} roughness={0.78} metalness={0.05} />
          )}
        </mesh>

        {/* Sun Corona Glow */}
        {planet.id === "sun" && (
          <mesh>
            <sphereGeometry args={[radius * 1.24, 32, 32]} />
            <meshBasicMaterial color="#FDB813" transparent opacity={0.14} depthWrite={false} />
          </mesh>
        )}

        {/* Planetary Rings (Saturn & Uranus) */}
        {(planet.id === "saturn" || planet.id === "uranus") && ringTexture && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[
                radius * (planet.id === "saturn" ? 1.32 : 1.45),
                radius * (planet.id === "saturn" ? 2.38 : 1.85),
                64,
              ]}
            />
            <meshBasicMaterial
              map={ringTexture}
              side={THREE.DoubleSide}
              transparent
              opacity={planet.id === "saturn" ? 0.92 : 0.45}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {showLabels && (
        <PlanetLabelSprite name={planet.name} selected={selected} yOffset={radius + 0.75} />
      )}
    </group>
  );
}

function CameraRig({
  selectedPlanetId,
  focusTrigger,
  positionsRef,
  controlsRef,
  planets,
  scaleMode,
}: {
  selectedPlanetId: string;
  focusTrigger: number;
  positionsRef: React.MutableRefObject<Record<string, THREE.Vector3>>;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  planets: Planet[];
  scaleMode: ScaleMode;
}) {
  const { camera } = useThree();
  const desiredTargetRef = useRef<THREE.Vector3 | null>(null);
  const desiredCamPosRef = useRef<THREE.Vector3 | null>(null);
  const animatingRef = useRef(false);

  useEffect(() => {
    if (focusTrigger === 0) return;
    if (selectedPlanetId === "overview") {
      desiredTargetRef.current = new THREE.Vector3(0, 0, 0);
      desiredCamPosRef.current =
        scaleMode === "proportional"
          ? new THREE.Vector3(0, 56, 118)
          : new THREE.Vector3(0, 28, 52);
      animatingRef.current = true;
      return;
    }

    const pos = positionsRef.current[selectedPlanetId] ?? new THREE.Vector3(0, 0, 0);
    const planet = planets.find((p) => p.id === selectedPlanetId);
    const visualR = planet ? getVisualRadius(planet, scaleMode) : 1;
    const offsetDist = Math.max(4.5, visualR * 5.2);

    desiredTargetRef.current = pos.clone();
    desiredCamPosRef.current = pos
      .clone()
      .add(new THREE.Vector3(offsetDist * 0.8, offsetDist * 0.52, offsetDist));
    animatingRef.current = true;
  }, [focusTrigger, selectedPlanetId, planets, positionsRef, scaleMode]);

  useFrame((_, rawDelta) => {
    if (!animatingRef.current || !desiredTargetRef.current || !desiredCamPosRef.current) return;
    const t = Math.min(1, rawDelta * 3.8);
    camera.position.lerp(desiredCamPosRef.current, t);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(desiredTargetRef.current, t);
      controlsRef.current.update();
    }
    if (camera.position.distanceTo(desiredCamPosRef.current) < 0.15) {
      animatingRef.current = false;
    }
  });

  return null;
}

const emptySubscribe = () => () => {};

export function SolarSystemCanvas({
  planets,
  selectedPlanetId,
  onSelectPlanet,
  paused = false,
  speedMultiplier = 1,
  showOrbits = true,
  showLabels = true,
  scaleMode = "observatory",
  compact = false,
  focusTrigger = 0,
}: SolarSystemCanvasProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const positionsRef = useRef<Record<string, THREE.Vector3>>({});
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  if (!mounted) {
    return (
      <div
        className={`flex w-full items-center justify-center rounded-md border border-white/[0.08] bg-[#04060B] font-mono text-xs tracking-[0.16em] text-[#7D8C9F] uppercase ${
          compact ? "h-[300px] sm:h-[360px]" : "h-[460px] sm:h-[580px]"
        }`}
      >
        Initializing 3D Heliocentric Projection...
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-md border border-white/[0.08] bg-[#030509] ${
        compact ? "h-[300px] sm:h-[360px]" : "h-[460px] sm:h-[580px]"
      }`}
    >
      <Canvas
        camera={{
          position: compact ? [0, 26, 44] : [0, 28, 52],
          fov: 44,
          near: 0.1,
          far: 600,
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#030509"]} />
        <ambientLight intensity={0.28} />
        <pointLight position={[0, 0, 0]} intensity={2.6} decay={0.35} color="#FFF4D8" />
        <hemisphereLight args={["#6488C4", "#080B14", 0.22]} />

        <Stars radius={160} depth={70} count={2400} factor={3.2} saturation={0.2} fade speed={0.3} />

        <AsteroidBelt scaleMode={scaleMode} />

        {showOrbits &&
          planets
            .filter((p) => p.orbit !== null)
            .map((p) => (
              <OrbitPath
                key={`${p.id}-orbit-${scaleMode}`}
                planet={p}
                selected={p.id === selectedPlanetId}
                scaleMode={scaleMode}
              />
            ))}

        {planets.map((planet) => (
          <PlanetMesh
            key={planet.id}
            planet={planet}
            selected={planet.id === selectedPlanetId}
            paused={paused}
            speedMultiplier={speedMultiplier}
            showLabels={showLabels}
            scaleMode={scaleMode}
            onSelect={onSelectPlanet}
            positionsRef={positionsRef}
          />
        ))}

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.06}
          minDistance={3}
          maxDistance={220}
        />

        <CameraRig
          selectedPlanetId={selectedPlanetId}
          focusTrigger={focusTrigger}
          positionsRef={positionsRef}
          controlsRef={controlsRef}
          planets={planets}
          scaleMode={scaleMode}
        />
      </Canvas>
    </div>
  );
}
