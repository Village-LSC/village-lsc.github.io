import React, { useEffect, useRef } from 'react';

interface DitherNebulaProps {
  enabled?: boolean;
  paused?: boolean;
  onDominantPaletteChange?: (rampIndex: number) => void;
  onPerformanceLagDetected?: () => void;
}

const IS_LITTLE_ENDIAN = (() => {
  const buf = new ArrayBuffer(4);
  new Uint32Array(buf)[0] = 0x0a0b0c0d;
  return new Uint8Array(buf)[0] === 0x0d;
})();

function packRgba(r: number, g: number, b: number, a = 255): number {
  if (IS_LITTLE_ENDIAN) {
    return ((a & 255) << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255);
  }
  return ((r & 255) << 24) | ((g & 255) << 16) | ((b & 255) << 8) | (a & 255);
}

const VOID_PIXEL_32 = packRgba(9, 2, 18, 255);

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const BAYER_8X8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

// Precomputed power LUTs (0..1 -> 0..1) to eliminate Math.pow inside inner pixel loops
const LUT_SIZE = 256;
const POW_VOL_LUT = new Float32Array(LUT_SIZE + 1);
const POW_MIX_LUT = new Float32Array(LUT_SIZE + 1);
const POW_CURSOR_LUT = new Float32Array(LUT_SIZE + 1);
const POW_ELEM_LUT = new Float32Array(LUT_SIZE + 1);
for (let i = 0; i <= LUT_SIZE; i++) {
  const u = i / LUT_SIZE;
  POW_VOL_LUT[i] = Math.pow(u, 0.78) * 1.05;
  POW_MIX_LUT[i] = Math.min(0.5, Math.pow(u, 0.85) * 0.5);
  POW_CURSOR_LUT[i] = Math.pow(u, 1.5);
  POW_ELEM_LUT[i] = Math.pow(u, 1.65);
}

type RGB = readonly [number, number, number];

const PURPLE_RAMP: readonly RGB[] = [
  [9, 2, 18],
  [15, 4, 28],
  [22, 7, 42],
  [32, 10, 58],
  [45, 16, 82],
  [64, 24, 115],
  [91, 37, 156],
  [128, 62, 204],
  [172, 108, 240],
];

const INDIGO_RAMP: readonly RGB[] = [
  [9, 2, 18],
  [11, 7, 30],
  [16, 13, 46],
  [22, 21, 66],
  [30, 32, 92],
  [42, 48, 126],
  [62, 72, 168],
  [94, 108, 210],
  [140, 156, 242],
];

const TEAL_RAMP: readonly RGB[] = [
  [9, 2, 18],
  [8, 13, 28],
  [10, 21, 40],
  [13, 32, 56],
  [17, 45, 76],
  [24, 64, 102],
  [34, 92, 138],
  [52, 132, 180],
  [88, 180, 218],
];

const EMERALD_RAMP: readonly RGB[] = [
  [9, 2, 18],
  [8, 15, 22],
  [11, 24, 32],
  [14, 36, 44],
  [19, 51, 59],
  [27, 72, 80],
  [38, 102, 108],
  [58, 144, 142],
  [94, 192, 180],
];

const CRIMSON_RAMP: readonly RGB[] = [
  [9, 2, 18],
  [22, 5, 22],
  [34, 8, 29],
  [48, 12, 38],
  [66, 17, 50],
  [90, 25, 68],
  [124, 38, 92],
  [168, 60, 124],
  [212, 98, 160],
];

const AMBER_RAMP: readonly RGB[] = [
  [9, 2, 18],
  [20, 10, 16],
  [32, 16, 20],
  [46, 24, 24],
  [64, 34, 29],
  [88, 48, 36],
  [122, 68, 46],
  [164, 98, 62],
  [208, 140, 88],
];

const PLUM_RAMP: readonly RGB[] = [
  [9, 2, 18],
  [19, 4, 28],
  [30, 7, 43],
  [43, 11, 61],
  [58, 17, 82],
  [82, 25, 114],
  [115, 38, 152],
  [156, 66, 198],
  [204, 112, 236],
];

const CORAL_RAMP: readonly RGB[] = [
  [9, 2, 18],
  [22, 7, 20],
  [34, 11, 24],
  [50, 17, 30],
  [70, 24, 38],
  [96, 36, 50],
  [132, 52, 66],
  [176, 78, 88],
  [218, 116, 118],
];

const RAMPS = [
  PURPLE_RAMP,
  INDIGO_RAMP,
  TEAL_RAMP,
  EMERALD_RAMP,
  CRIMSON_RAMP,
  AMBER_RAMP,
  PLUM_RAMP,
  CORAL_RAMP,
] as const;

const STAR_RGB: readonly RGB[] = [
  [251, 247, 255],
  [216, 180, 254],
  [253, 230, 138],
  [125, 211, 252],
  [110, 231, 183],
  [253, 164, 175],
  [147, 197, 253],
  [253, 186, 116],
];

const SHOOTING_STAR_RGB: readonly RGB[] = [
  [251, 247, 255],
  [216, 180, 254],
  [165, 180, 252],
  [245, 208, 254],
];

export function DitherNebula({
  enabled = true,
  paused = false,
  onDominantPaletteChange,
  onPerformanceLagDetected,
}: DitherNebulaProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onPaletteChangeRef = useRef(onDominantPaletteChange);
  onPaletteChangeRef.current = onDominantPaletteChange;
  const onLagRef = useRef(onPerformanceLagDetected);
  onLagRef.current = onPerformanceLagDetected;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const startLoopRef = useRef<(() => void) | null>(null);
  const stopLoopRef = useRef<(() => void) | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });
  const hoveredElRef = useRef<HTMLElement | null>(null);
  const hoveredRectCssRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const initialDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const TARGET_PHYSICAL_PIXEL = 6 * initialDpr;
    let currentPixelScale = TARGET_PHYSICAL_PIXEL / initialDpr;

    let width = 1;
    let height = 1;
    let totalPixels = 1;
    let animationFrameId = 0;

    // Seeded random cosmos generator
    const createRng = (seedStart: number) => {
      let s = seedStart >>> 0;
      if (s === 0) s = 123456789;
      return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };
    };

    const seed = Math.floor(Math.random() * 0xffffffff) >>> 0;
    const rng = createRng(seed);

    const PERM = new Uint8Array(512);
    const VAL = new Float32Array(256);
    const pBase = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      pBase[i] = i;
      VAL[i] = rng();
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = pBase[i];
      pBase[i] = pBase[j];
      pBase[j] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      PERM[i] = pBase[i & 255];
    }

    // Precompute 256x256 wrapped lattice table: turns 3 dependent lookups into 1 flat lookup
    const NOISE_LATTICE = new Float32Array(65536);
    for (let y = 0; y < 256; y++) {
      const rowOff = y << 8;
      for (let x = 0; x < 256; x++) {
        NOISE_LATTICE[rowOff | x] = VAL[PERM[PERM[x] + y]];
      }
    }

    const noise2 = (x: number, y: number) => {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const xf = x - xi;
      const yf = y - yi;

      const u = xf * xf * (3 - 2 * xf);
      const v = yf * yf * (3 - 2 * yf);

      const x0 = xi & 255;
      const y0 = yi & 255;
      const x1 = (x0 + 1) & 255;
      const y1 = (y0 + 1) & 255;

      const r0 = y0 << 8;
      const r1 = y1 << 8;
      const aa = NOISE_LATTICE[r0 | x0];
      const ba = NOISE_LATTICE[r0 | x1];
      const ab = NOISE_LATTICE[r1 | x0];
      const bb = NOISE_LATTICE[r1 | x1];

      const nx0 = aa + u * (ba - aa);
      return nx0 + v * (ab + u * (bb - ab) - nx0);
    };

    const fbm2 = (x: number, y: number) =>
      noise2(x, y) * 0.66 + noise2(x * 2.05 + 13.7, y * 2.03 + 7.3) * 0.34;

    const fbm3 = (x: number, y: number) =>
      noise2(x, y) * 0.56 +
      noise2(x * 2.04 + 13.7, y * 2.02 + 7.3) * 0.29 +
      noise2(x * 4.09 + 27.1, y * 4.05 + 19.9) * 0.15;

    // Pick strictly 3 cosmic palettes for this screen
    const rampOrder = [0, 1, 2, 3, 4, 5, 6, 7];
    for (let i = rampOrder.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = rampOrder[i];
      rampOrder[i] = rampOrder[j];
      rampOrder[j] = tmp;
    }
    const TYPE_RAMPS = [rampOrder[0], rampOrder[1], rampOrder[2]] as const;

    const linearAngle = (rng() - 0.5) * 1.1;
    const cosLin = Math.cos(linearAngle);
    const sinLin = Math.sin(linearAngle);
    const linearShiftX = rng() * 140;
    const linearShiftY = rng() * 140;
    const scatterShiftX = rng() * 180;
    const scatterShiftY = rng() * 180;

    const VOL_TILE_W = 440;
    const VOL_TILE_H = 300;
    const volumetricBlobs = [
      {
        cx: 65 + rng() * 160,
        cy: 40 + rng() * 110,
        radius: 58 + rng() * 28,
        phaseOffset: rng() * 20,
      },
      {
        cx: 245 + rng() * 140,
        cy: 60 + rng() * 120,
        radius: 64 + rng() * 32,
        phaseOffset: 25 + rng() * 20,
      },
      {
        cx: 110 + rng() * 220,
        cy: 175 + rng() * 90,
        radius: 54 + rng() * 28,
        phaseOffset: 50 + rng() * 20,
      },
    ];

    const driftAngle = rng() * Math.PI * 2;
    const driftDirX = Math.cos(driftAngle);
    const driftDirY = Math.sin(driftAngle);

    const lightChoices = [
      { dx: 3, dy: 2 },
      { dx: -3, dy: -2 },
      { dx: 3, dy: -2 },
    ];
    const chosenLight = lightChoices[Math.floor(rng() * lightChoices.length)];
    const lightNormLen = Math.hypot(chosenLight.dx, chosenLight.dy);
    const lightUnitX = chosenLight.dx / lightNormLen;
    const lightUnitY = chosenLight.dy / lightNormLen;

    type StarTier = 'small' | 'medium' | 'large';
    interface SkyStar {
      wx: number;
      wy: number;
      tier: StarTier;
      shapeVariant: number;
      baseAlpha: number;
      speed: number;
      phase: number;
      fadeDelay: number;
      colorIndex: number;
      glowPower: number;
      glowRadius: number;
    }

    const WORLD_STAR_W = 860;
    const WORLD_STAR_H = 520;
    const stars: SkyStar[] = Array.from({ length: 320 }, (_, idx) => {
      const roll = rng();
      let tier: StarTier = 'small';
      if (roll > 0.945) {
        tier = 'large';
      } else if (roll > 0.68) {
        tier = 'medium';
      }

      const shapeVariant =
        tier === 'large'
          ? Math.floor(rng() * 3)
          : tier === 'medium'
          ? Math.floor(rng() * 3)
          : 0;

      return {
        wx: Math.floor(rng() * WORLD_STAR_W),
        wy: Math.floor(rng() * WORLD_STAR_H),
        tier,
        shapeVariant,
        baseAlpha:
          tier === 'small'
            ? 0.09 + rng() * 0.14
            : tier === 'medium'
            ? 0.34 + rng() * 0.36
            : 0.68 + rng() * 0.28,
        speed: 0.025 + rng() * 0.045,
        phase: rng() * Math.PI * 2,
        fadeDelay: rng() * 18,
        colorIndex: Math.floor(rng() * STAR_RGB.length) || idx % STAR_RGB.length,
        glowPower: tier === 'large' ? 0.85 : tier === 'medium' ? 0.3 + rng() * 0.14 : 0,
        glowRadius: tier === 'large' ? 12 : tier === 'medium' ? 5 : 0,
      };
    });

    const glowingStars = stars.filter((s) => s.glowRadius > 0);

    interface ShootingStar {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      colorIndex: number;
      tier: StarTier;
    }
    const shootingStars: ShootingStar[] = [];

    const spawnShootingStar = (tier: StarTier) => {
      const fromLeft = Math.random() < 0.6;
      const startX = fromLeft
        ? Math.random() * width * 0.75
        : width * (0.25 + Math.random() * 0.75);
      const startY = Math.random() * height * (tier === 'large' ? 0.55 : 0.45);
      const speed =
        tier === 'large'
          ? 4.6 + Math.random() * 1.4
          : tier === 'medium'
          ? 3.8 + Math.random() * 1.6
          : 3.0 + Math.random() * 1.3;
      const angle = fromLeft
        ? Math.PI * 0.14 + Math.random() * 0.22
        : Math.PI * 0.72 + Math.random() * 0.22;

      shootingStars.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife:
          tier === 'large'
            ? 24 + Math.floor(Math.random() * 10)
            : tier === 'medium'
            ? 16 + Math.floor(Math.random() * 8)
            : 12 + Math.floor(Math.random() * 7),
        colorIndex: Math.floor(Math.random() * SHOOTING_STAR_RGB.length),
        tier,
      });
    };

    interface NebulaRay {
      x: number;
      y: number;
      ux: number;
      uy: number;
      halfLen: number;
      halfWidth: number;
      life: number;
      maxLife: number;
      driftSpeed: number;
    }
    const nebulaRays: NebulaRay[] = [];

    // Screen buffers + cached static-nebula rendering buffers
    let frameImageData = ctx.createImageData(width, height);
    let frameData32 = new Uint32Array(frameImageData.data.buffer);
    let basePixelBuf32 = new Uint32Array(totalPixels);

    let linearBuf = new Float32Array(totalPixels);
    let volBuf = new Float32Array(totalPixels);
    let scatterBuf = new Float32Array(totalPixels);
    let heightBuf = new Float32Array(totalPixels);
    let volLightBuf = new Float32Array(totalPixels);
    let staticStarLightBuf = new Float32Array(totalPixels);

    // Per-pixel cached shading metadata for instant dirty-box dynamic relighting
    let pixelMaskBuf = new Uint8Array(totalPixels);
    let baseLevelBuf = new Float32Array(totalPixels);
    let combinedDensityBuf = new Float32Array(totalPixels);
    let metaPrimaryRamp = new Uint8Array(totalPixels);
    let metaSecondaryRamp = new Uint8Array(totalPixels);
    let metaBlendWeight = new Float32Array(totalPixels);
    let metaIsScattered = new Uint8Array(totalPixels);
    let metaBayer = new Float32Array(totalPixels);

    // Per-frame dynamic dirty-region accumulators (only touched pixels are processed & cleared)
    let dynStarBuf = new Float32Array(totalPixels);
    let dynGlowBuf = new Float32Array(totalPixels);
    let dynRayBuf = new Float32Array(totalPixels);
    let dirtyMark = new Uint8Array(totalPixels);
    let dirtyList = new Int32Array(totalPixels);
    let dirtyCount = 0;

    let geometrySlice = 0;
    const TOTAL_SLICES = 6;
    const sliceRampWeights = new Float64Array(TOTAL_SLICES * 3);
    let reportedRamp = -1;

    const maxStop = PURPLE_RAMP.length - 1;

    const shadeNebulaPixel = (idx: number, litLevel: number, rayStrength: number): number => {
      const clampedLevel = litLevel < 0.05 ? 0.05 : litLevel >= maxStop ? maxStop - 0.001 : litLevel;
      const baseIdx = Math.floor(clampedLevel);
      const frac = clampedLevel - baseIdx;

      const bayer = metaBayer[idx];
      let colorIdx: number;
      if (metaIsScattered[idx]) {
        colorIdx = frac > bayer ? (baseIdx + 1 > maxStop ? maxStop : baseIdx + 1) : baseIdx;
      } else {
        let ditherFrac = (frac - 0.16) / 0.68;
        if (ditherFrac < 0) ditherFrac = 0;
        else if (ditherFrac > 1) ditherFrac = 1;
        colorIdx = ditherFrac > bayer ? (baseIdx + 1 > maxStop ? maxStop : baseIdx + 1) : baseIdx;
      }

      const primaryRgb = RAMPS[metaPrimaryRamp[idx]][colorIdx];
      let r = primaryRgb[0];
      let g = primaryRgb[1];
      let b = primaryRgb[2];

      const blendWeight = metaBlendWeight[idx];
      if (blendWeight > 0) {
        const secondaryRgb = RAMPS[metaSecondaryRamp[idx]][colorIdx];
        r = Math.round(r + (secondaryRgb[0] - r) * blendWeight);
        g = Math.round(g + (secondaryRgb[1] - g) * blendWeight);
        b = Math.round(b + (secondaryRgb[2] - b) * blendWeight);
      }

      if (rayStrength > 0.05) {
        const lift = rayStrength * 0.18 > 0.2 ? 0.2 : rayStrength * 0.18;
        r = Math.round(r + (235 - r) * lift);
        g = Math.round(g + (225 - g) * lift);
        b = Math.round(b + (248 - b) * lift);
      }

      return packRgba(r, g, b, 255);
    };

    const refreshStaticStarLight = (t: number) => {
      staticStarLightBuf.fill(0);
      for (let i = 0; i < glowingStars.length; i++) {
        const star = glowingStars[i];
        if (star.wx >= width || star.wy >= height) continue;
        const fadeIntro = Math.min(1, Math.max(0, (t - star.fadeDelay) / 28 + 0.35));
        const twinkle = (0.58 + 0.42 * Math.sin(t * star.speed + star.phase)) * fadeIntro;
        const strength = star.glowPower * twinkle;
        const radius = star.glowRadius;
        if (strength <= 0.01) continue;

        const minX = Math.max(0, Math.floor(star.wx - radius));
        const maxX = Math.min(width - 1, Math.ceil(star.wx + radius));
        const minY = Math.max(0, Math.floor(star.wy - radius));
        const maxY = Math.min(height - 1, Math.ceil(star.wy + radius));
        const rSq = radius * radius;

        for (let py = minY; py <= maxY; py++) {
          const dy = py - star.wy;
          const dySq = dy * dy;
          const rowOff = py * width;
          for (let px = minX; px <= maxX; px++) {
            const idx = rowOff + px;
            if (linearBuf[idx] <= 0.01 && volBuf[idx] <= 0.01 && scatterBuf[idx] <= 0.01) {
              continue;
            }
            const dx = px - star.wx;
            const distSq = dx * dx + dySq;
            if (distSq >= rSq) continue;
            const falloff = 1 - Math.sqrt(distSq) / radius;
            staticStarLightBuf[idx] += falloff * falloff * strength;
          }
        }
      }
    };

    const updateGeometryRows = (t: number, yStart: number, yEnd: number) => {
      const driftX = t * 0.042 * driftDirX;
      const driftY = t * 0.042 * driftDirY;
      const volDriftX = t * 0.028 * driftDirX;
      const volDriftY = t * 0.028 * driftDirY;
      const scatterDriftX = t * 0.056 * driftDirX;
      const scatterDriftY = t * 0.056 * driftDirY;

      for (let y = yStart; y < yEnd; y++) {
        const rowOffset = y * width;

        for (let x = 0; x < width; x++) {
          const idx = rowOffset + x;

          // --- TYPE 1: LINEAR ---
          const lx = x - driftX + linearShiftX;
          const ly = y - driftY + linearShiftY;
          const rotX = lx * cosLin + ly * sinLin;
          const rotY = ly * cosLin - lx * sinLin;
          const ax = rotX * 0.0044;
          const ay = rotY * 0.0074;

          const qx = fbm2(ax + 2.3, ay + 8.7);
          const qy = fbm2(ax + 7.9, ay + 3.4);
          const rx = fbm2(ax + 2.35 * qx + 4.2, ay + 2.35 * qy + 6.1);
          const ry = fbm2(ax + 2.35 * qx + 7.1, ay + 2.35 * qy + 1.8);

          const linSample = fbm3(ax + 2.1 * rx, ay + 2.1 * ry);
          const linRidge =
            1 - Math.abs(fbm2(ax * 1.35 + 1.8 * rx, ay * 1.35 + 1.8 * ry) * 2 - 1);
          const linRaw = linSample * 0.76 + (linRidge - 0.5) * 0.24;
          const linearDensity = Math.max(0, Math.min(1, (linRaw - 0.505) * 5.2));
          linearBuf[idx] = linearDensity;

          // --- TYPE 2: VOLUMETRIC ---
          let volDensity = 0;
          let volDirBias = 0;
          const vx = x - volDriftX;
          const vy = y - volDriftY;

          for (let b = 0; b < volumetricBlobs.length; b++) {
            const blob = volumetricBlobs[b];
            let dx = ((vx - blob.cx) % VOL_TILE_W + VOL_TILE_W) % VOL_TILE_W;
            if (dx > VOL_TILE_W * 0.5) dx -= VOL_TILE_W;
            let dy = ((vy - blob.cy) % VOL_TILE_H + VOL_TILE_H) % VOL_TILE_H;
            if (dy > VOL_TILE_H * 0.5) dy -= VOL_TILE_H;

            const distSq = dx * dx + dy * dy;
            const maxR = blob.radius * 1.18;
            if (distSq >= maxR * maxR) continue;

            const dist = Math.sqrt(distSq);
            const edgeNoise =
              (fbm2(vx * 0.013 + blob.phaseOffset, vy * 0.013 + blob.phaseOffset) - 0.5) * 0.32;
            const radial = 1 - dist / blob.radius + edgeNoise;
            if (radial <= 0) continue;

            const lutIdx = Math.min(LUT_SIZE, Math.max(0, Math.round(radial * LUT_SIZE)));
            const d = Math.min(1, radial <= 1 ? POW_VOL_LUT[lutIdx] : Math.pow(radial, 0.78) * 1.05);
            if (d > volDensity) {
              volDensity = d;
              const invD = dist > 0.001 ? 1 / dist : 0;
              volDirBias =
                (dx * invD * lightUnitX + dy * invD * lightUnitY) * (0.4 + 0.6 * radial);
            }
          }
          volBuf[idx] = volDensity;
          volLightBuf[idx] = volDirBias;

          // --- TYPE 3: SCATTERED ---
          const sx = x - scatterDriftX + scatterShiftX;
          const sy = y - scatterDriftY + scatterShiftY;
          const scatBroad = fbm2(sx * 0.0062 + 41.2, sy * 0.0062 + 11.8);
          const scatFine =
            noise2(sx * 0.028 + 7.3, sy * 0.028 + 29.1) * 0.56 +
            noise2(sx * 0.068 + 19.7, sy * 0.068 + 3.1) * 0.44;
          const scatRaw = scatBroad * 0.62 + scatFine * 0.38;
          const scatterDensity = Math.max(0, Math.min(1, (scatRaw - 0.535) * 4.8));
          scatterBuf[idx] = scatterDensity;

          heightBuf[idx] = Math.max(linRaw, volDensity * 0.68, scatRaw * 0.85);
        }
      }
    };

    const bakeNebulaSlice = (sliceIdx: number, yStart: number, yEnd: number) => {
      const wOff = sliceIdx * 3;
      sliceRampWeights[wOff] = 0;
      sliceRampWeights[wOff + 1] = 0;
      sliceRampWeights[wOff + 2] = 0;

      for (let y = yStart; y < yEnd; y++) {
        const bayer4Row = BAYER_4X4[y & 3];
        const bayer8Row = BAYER_8X8[y & 7];
        const mixBayerRow = BAYER_8X8[(y + 3) & 7];
        const dustBayerRow = BAYER_8X8[(y + 5) & 7];
        const rowOffset = y * width;

        const sampleY = Math.max(0, Math.min(height - 1, y + chosenLight.dy));
        const sampleRowOffset = sampleY * width;

        for (let x = 0; x < width; x++) {
          const idx = rowOffset + x;
          const d0 = linearBuf[idx];
          const d1 = volBuf[idx];
          const d2 = scatterBuf[idx];

          if (d0 <= 0.01 && d1 <= 0.01 && d2 <= 0.01) {
            pixelMaskBuf[idx] = 0;
            basePixelBuf32[idx] = VOID_PIXEL_32;
            continue;
          }

          let firstType = 0;
          let firstD = d0;
          let secondType = 1;
          let secondD = d1;

          if (d1 > firstD) {
            secondType = firstType;
            secondD = firstD;
            firstType = 1;
            firstD = d1;
          }
          if (d2 > firstD) {
            secondType = firstType;
            secondD = firstD;
            firstType = 2;
            firstD = d2;
          } else if (d2 > secondD) {
            secondType = 2;
            secondD = d2;
          }

          let chosenType = firstType;
          let chosenDensity = firstD;
          if (secondD > 0.03 && firstD > 0.03) {
            const ratio = secondD / (firstD + secondD);
            const lutIdx = Math.min(LUT_SIZE, Math.max(0, Math.round(ratio * 2 * LUT_SIZE)));
            const mixProb = POW_MIX_LUT[lutIdx];
            const mixThreshold = (mixBayerRow[(x + 5) & 7] + 0.5) / 64;
            if (mixThreshold < mixProb) {
              chosenType = secondType;
              chosenDensity = secondD;
            }
          }

          if (chosenType === 2) {
            const dustProb = Math.min(1, chosenDensity * 1.18);
            const dustGate = (dustBayerRow[(x + 2) & 7] + 0.5) / 64;
            if (dustProb <= dustGate) {
              const fallbackD = Math.max(d0, d1);
              if (fallbackD > 0.03) {
                chosenType = d0 >= d1 ? 0 : 1;
                chosenDensity = fallbackD;
              } else {
                pixelMaskBuf[idx] = 0;
                basePixelBuf32[idx] = VOID_PIXEL_32;
                continue;
              }
            }
          }

          const combinedDensity = Math.min(1, chosenDensity + secondD * 0.18);
          const sampleX = Math.max(0, Math.min(width - 1, x + chosenLight.dx));
          const slope = heightBuf[idx] - heightBuf[sampleRowOffset + sampleX];
          let directionalLight = Math.max(-1.0, Math.min(1.85, slope * 17.5));
          if (chosenType === 1) {
            directionalLight = Math.max(
              -1.1,
              Math.min(2.1, directionalLight * 0.65 + volLightBuf[idx] * 1.45)
            );
          }

          const baseBand = 0.6 + combinedDensity * 3.5;
          const baseLevel = baseBand + directionalLight;

          pixelMaskBuf[idx] = 1;
          baseLevelBuf[idx] = baseLevel;
          combinedDensityBuf[idx] = combinedDensity;
          metaPrimaryRamp[idx] = TYPE_RAMPS[chosenType];

          const partnerType = chosenType === firstType ? secondType : firstType;
          const partnerDensity = chosenType === firstType ? secondD : firstD;
          if (partnerDensity > 0.02 && chosenDensity > 0.02) {
            const seamRatio = partnerDensity / (chosenDensity + partnerDensity);
            metaSecondaryRamp[idx] = TYPE_RAMPS[partnerType];
            metaBlendWeight[idx] = Math.min(0.46, seamRatio * 0.92);
          } else {
            metaBlendWeight[idx] = 0;
          }

          if (chosenType === 2) {
            metaIsScattered[idx] = 1;
            metaBayer[idx] = (bayer8Row[x & 7] + 0.5) / 64;
          } else {
            metaIsScattered[idx] = 0;
            metaBayer[idx] = (bayer4Row[x & 3] + 0.5) / 16;
          }

          const staticStarGlow = Math.min(3.3, staticStarLightBuf[idx] * 2.8);
          const litLevel = baseLevel + staticStarGlow;
          basePixelBuf32[idx] = shadeNebulaPixel(idx, litLevel, 0);

          const approxIdx = Math.max(0, Math.min(maxStop, Math.round(litLevel)));
          if (approxIdx > 0) {
            sliceRampWeights[wOff + chosenType] += 1 + approxIdx * 0.45;
          }
        }
      }
    };

    const evaluateDominantPalette = () => {
      let w0 = 0;
      let w1 = 0;
      let w2 = 0;
      for (let s = 0; s < TOTAL_SLICES; s++) {
        const off = s * 3;
        w0 += sliceRampWeights[off];
        w1 += sliceRampWeights[off + 1];
        w2 += sliceRampWeights[off + 2];
      }

      let bestType = 0;
      if (w1 > w0) bestType = 1;
      if (w2 > (bestType === 0 ? w0 : w1)) bestType = 2;

      if (reportedRamp === -1) {
        reportedRamp = TYPE_RAMPS[bestType];
        onPaletteChangeRef.current?.(reportedRamp);
      } else {
        const currentTypeIdx = TYPE_RAMPS.indexOf(reportedRamp);
        const currentWeight = currentTypeIdx === 0 ? w0 : currentTypeIdx === 1 ? w1 : w2;
        const bestWeight = bestType === 0 ? w0 : bestType === 1 ? w1 : w2;
        if (TYPE_RAMPS[bestType] !== reportedRamp && bestWeight > currentWeight * 1.15) {
          reportedRamp = TYPE_RAMPS[bestType];
          onPaletteChangeRef.current?.(reportedRamp);
        }
      }
    };

    const bakeFullScreen = (t: number) => {
      updateGeometryRows(t, 0, height);
      refreshStaticStarLight(t);
      for (let s = 0; s < TOTAL_SLICES; s++) {
        const y0 = Math.floor((s * height) / TOTAL_SLICES);
        const y1 = Math.floor(((s + 1) * height) / TOTAL_SLICES);
        bakeNebulaSlice(s, y0, y1);
      }
      evaluateDominantPalette();
    };

    const spawnNebulaRay = (seedPhaseRatio = 0) => {
      let rx = Math.random() * width;
      let ry = Math.random() * height;
      for (let attempt = 0; attempt < 10; attempt++) {
        const tx = Math.floor(Math.random() * width);
        const ty = Math.floor(Math.random() * height);
        const idx = ty * width + tx;
        if (linearBuf[idx] > 0.14 || volBuf[idx] > 0.14 || scatterBuf[idx] > 0.18) {
          rx = tx;
          ry = ty;
          break;
        }
      }

      const angle = (Math.random() < 0.5 ? 0.28 : 2.65) + (Math.random() - 0.5) * 0.45;
      const maxLife = 150 + Math.floor(Math.random() * 90);

      nebulaRays.push({
        x: rx,
        y: ry,
        ux: Math.cos(angle),
        uy: Math.sin(angle),
        halfLen: 22 + Math.random() * 28,
        halfWidth: 1.35 + Math.random() * 1.15,
        life: Math.floor(maxLife * seedPhaseRatio),
        maxLife,
        driftSpeed: 0.06 + Math.random() * 0.05,
      });
    };

    const markDirty = (idx: number) => {
      if (dirtyMark[idx] === 0) {
        dirtyMark[idx] = 1;
        dirtyList[dirtyCount++] = idx;
      }
    };

    const stampDynamicRay = (ray: NebulaRay) => {
      const lifeRatio = ray.life / ray.maxLife;
      const lifeEnvelope = Math.sin(Math.PI * lifeRatio);
      if (lifeEnvelope <= 0.01) return;

      const pad = ray.halfWidth + 2;
      const extentX = Math.abs(ray.ux) * ray.halfLen + pad;
      const extentY = Math.abs(ray.uy) * ray.halfLen + pad;

      const minX = Math.max(0, Math.floor(ray.x - extentX));
      const maxX = Math.min(width - 1, Math.ceil(ray.x + extentX));
      const minY = Math.max(0, Math.floor(ray.y - extentY));
      const maxY = Math.min(height - 1, Math.ceil(ray.y + extentY));

      const nx = -ray.uy;
      const ny = ray.ux;

      for (let py = minY; py <= maxY; py++) {
        const dy = py - ray.y;
        const rowOffset = py * width;
        for (let px = minX; px <= maxX; px++) {
          const idx = rowOffset + px;
          if (pixelMaskBuf[idx] === 0) continue;

          const baseNebula = Math.max(linearBuf[idx], volBuf[idx], scatterBuf[idx]);
          if (baseNebula <= 0.02) continue;

          const dx = px - ray.x;
          const along = dx * ray.ux + dy * ray.uy;
          if (Math.abs(along) > ray.halfLen) continue;

          const tAlong = (along + ray.halfLen) / (2 * ray.halfLen);
          const longEnvelope = Math.sin(Math.PI * tAlong);
          const localHalfW = ray.halfWidth * (0.28 + 0.72 * longEnvelope);

          const wobble = (noise2(px * 0.11, py * 0.11) - 0.5) * 1.0;
          const perp = Math.abs(dx * nx + dy * ny + wobble);
          if (perp >= localHalfW) continue;

          const crossEnvelope = Math.pow(1 - perp / localHalfW, 1.35);
          const presenceGate = Math.min(1, baseNebula * 2.0);
          const intensity = lifeEnvelope * longEnvelope * crossEnvelope * presenceGate;

          if (intensity > dynRayBuf[idx]) {
            dynRayBuf[idx] = intensity;
            markDirty(idx);
          }
        }
      }
    };

    const stampDynamicStarLight = (cx: number, cy: number, radius: number, strength: number) => {
      if (radius <= 0 || strength <= 0.01) return;
      const minX = Math.max(0, Math.floor(cx - radius));
      const maxX = Math.min(width - 1, Math.ceil(cx + radius));
      const minY = Math.max(0, Math.floor(cy - radius));
      const maxY = Math.min(height - 1, Math.ceil(cy + radius));
      const rSq = radius * radius;

      for (let py = minY; py <= maxY; py++) {
        const dy = py - cy;
        const dySq = dy * dy;
        const rowOffset = py * width;
        for (let px = minX; px <= maxX; px++) {
          const idx = rowOffset + px;
          if (pixelMaskBuf[idx] === 0) continue;
          const dx = px - cx;
          const distSq = dx * dx + dySq;
          if (distSq >= rSq) continue;

          const falloff = 1 - Math.sqrt(distSq) / radius;
          dynStarBuf[idx] += falloff * falloff * strength;
          markDirty(idx);
        }
      }
    };

    // Fast alpha-blended pixel plotter directly into frameImageData.data (zero Canvas2D fillRect calls!)
    const blendStarPixel = (x: number, y: number, rgb: RGB, alpha: number) => {
      if (x < 0 || x >= width || y < 0 || y >= height || alpha <= 0.01) return;
      const a = alpha > 1 ? 1 : alpha;
      const invA = 1 - a;
      const data = frameImageData.data;
      const off = (y * width + x) << 2;
      data[off] = Math.round(data[off] * invA + rgb[0] * a);
      data[off + 1] = Math.round(data[off + 1] * invA + rgb[1] * a);
      data[off + 2] = Math.round(data[off + 2] * invA + rgb[2] * a);
    };

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const nextScale = TARGET_PHYSICAL_PIXEL / dpr;
      const nextW = Math.max(1, Math.ceil(window.innerWidth / nextScale));
      const nextH = Math.max(1, Math.ceil(window.innerHeight / nextScale));

      if (nextW === width && nextH === height && nextScale === currentPixelScale && totalPixels > 1) {
        return;
      }

      currentPixelScale = nextScale;
      width = nextW;
      height = nextH;
      totalPixels = width * height;

      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width * currentPixelScale}px`;
      canvas.style.height = `${height * currentPixelScale}px`;

      frameImageData = ctx.createImageData(width, height);
      frameData32 = new Uint32Array(frameImageData.data.buffer);
      basePixelBuf32 = new Uint32Array(totalPixels);

      linearBuf = new Float32Array(totalPixels);
      volBuf = new Float32Array(totalPixels);
      scatterBuf = new Float32Array(totalPixels);
      heightBuf = new Float32Array(totalPixels);
      volLightBuf = new Float32Array(totalPixels);
      staticStarLightBuf = new Float32Array(totalPixels);

      pixelMaskBuf = new Uint8Array(totalPixels);
      baseLevelBuf = new Float32Array(totalPixels);
      combinedDensityBuf = new Float32Array(totalPixels);
      metaPrimaryRamp = new Uint8Array(totalPixels);
      metaSecondaryRamp = new Uint8Array(totalPixels);
      metaBlendWeight = new Float32Array(totalPixels);
      metaIsScattered = new Uint8Array(totalPixels);
      metaBayer = new Float32Array(totalPixels);

      dynStarBuf = new Float32Array(totalPixels);
      dynGlowBuf = new Float32Array(totalPixels);
      dynRayBuf = new Float32Array(totalPixels);
      dirtyMark = new Uint8Array(totalPixels);
      dirtyList = new Int32Array(totalPixels);
      dirtyCount = 0;

      hoveredRectCssRef.current = null;
      geometrySlice = 0;
      bakeFullScreen(time);
    };

    let time = 0;
    let frameCount = 0;
    const INTRO_DURATION_MS = 6500;
    let introStartTime: number | null = null;
    let introProgress = prefersReducedMotion ? 1 : 0;
    let nextMeteorDelay = 30;
    let nextLargeMeteorDelay = 55;
    let nextRayDelay = 75;
    let smoothMx = -9999;
    let smoothMy = -9999;
    let smoothGlowStrength = 0;
    let smoothElemRect = { left: 0, top: 0, right: 0, bottom: 0 };
    let smoothElemGlow = 0;

    let lastTouchTime = 0;

    const handleTouchStart = () => {
      lastTouchTime = performance.now();
      mouseRef.current.active = false;
      hoveredElRef.current = null;
      hoveredRectCssRef.current = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (pausedRef.current || performance.now() - lastTouchTime < 800) return;
      mouseRef.current = {
        x: e.clientX / currentPixelScale,
        y: e.clientY / currentPixelScale,
        active: true,
      };
      const target = e.target instanceof Element ? e.target : null;
      const nextEl = target
        ? (target.closest('[data-nebula-light], button, a') as HTMLElement | null)
        : null;
      if (nextEl !== hoveredElRef.current) {
        hoveredElRef.current = nextEl;
        hoveredRectCssRef.current = nextEl ? nextEl.getBoundingClientRect() : null;
      }
    };

    const handleScroll = () => {
      if (pausedRef.current) return;
      if (hoveredElRef.current && hoveredElRef.current.isConnected) {
        hoveredRectCssRef.current = hoveredElRef.current.getBoundingClientRect();
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      hoveredElRef.current = null;
      hoveredRectCssRef.current = null;
    };

    const drawCosmos = (t: number, incrementalSlice: boolean) => {
      if (incrementalSlice) {
        // Update 1/6th of screen rows per frame for zero-spike smooth nebula drift
        if (geometrySlice === 0) {
          refreshStaticStarLight(t);
        }
        const y0 = Math.floor((geometrySlice * height) / TOTAL_SLICES);
        const y1 = Math.floor(((geometrySlice + 1) * height) / TOTAL_SLICES);
        updateGeometryRows(t, y0, y1);
        bakeNebulaSlice(geometrySlice, y0, y1);

        geometrySlice += 1;
        if (geometrySlice >= TOTAL_SLICES) {
          geometrySlice = 0;
          if (frameCount % 24 === 0) {
            evaluateDominantPalette();
          }
        }
      }

      // 1) Instant memcpy of cached base nebula frame
      frameData32.set(basePixelBuf32);
      dirtyCount = 0;

      // 2) Stamp dynamic "Луч" rays into dirty list
      for (let i = 0; i < nebulaRays.length; i++) {
        stampDynamicRay(nebulaRays[i]);
      }

      // 3) Stamp active flying stars' dynamic illumination
      for (let i = 0; i < shootingStars.length; i++) {
        const s = shootingStars[i];
        const progress = s.life / s.maxLife;
        const smoothEnvelope = Math.pow(Math.sin(Math.PI * progress), 0.75);
        const radius = s.tier === 'large' ? 48 : s.tier === 'medium' ? 6 : 3;
        const power = s.tier === 'large' ? 1.55 : s.tier === 'medium' ? 0.68 : 0.14;
        stampDynamicStarLight(s.x, s.y, radius, power * smoothEnvelope);
      }

      // 4) Stamp cursor hover illumination (26px bounding box)
      if (smoothGlowStrength > 0.01) {
        const cursorGlowRadius = 26;
        const cursorGlowRadiusSq = cursorGlowRadius * cursorGlowRadius;
        const minX = Math.max(0, Math.floor(smoothMx - cursorGlowRadius));
        const maxX = Math.min(width - 1, Math.ceil(smoothMx + cursorGlowRadius));
        const minY = Math.max(0, Math.floor(smoothMy - cursorGlowRadius));
        const maxY = Math.min(height - 1, Math.ceil(smoothMy + cursorGlowRadius));

        for (let py = minY; py <= maxY; py++) {
          const dy = py - smoothMy;
          const dySq = dy * dy;
          const rowOff = py * width;
          for (let px = minX; px <= maxX; px++) {
            const idx = rowOff + px;
            if (pixelMaskBuf[idx] === 0) continue;
            const dx = px - smoothMx;
            const distSq = dx * dx + dySq;
            if (distSq >= cursorGlowRadiusSq) continue;

            const u = 1 - Math.sqrt(distSq) / cursorGlowRadius;
            const radialFalloff = POW_CURSOR_LUT[Math.min(LUT_SIZE, Math.max(0, Math.round(u * LUT_SIZE)))];
            const densityGate = Math.min(1, combinedDensityBuf[idx] * 1.9);
            dynGlowBuf[idx] += radialFalloff * smoothGlowStrength * densityGate * 2.8;
            markDirty(idx);
          }
        }
      }

      // 5) Stamp hovered UI element illumination (22px bounding box around element)
      if (smoothElemGlow > 0.01) {
        const elemGlowRadius = 22;
        const elemGlowRadiusSq = elemGlowRadius * elemGlowRadius;
        const minX = Math.max(0, Math.floor(smoothElemRect.left - elemGlowRadius));
        const maxX = Math.min(width - 1, Math.ceil(smoothElemRect.right + elemGlowRadius));
        const minY = Math.max(0, Math.floor(smoothElemRect.top - elemGlowRadius));
        const maxY = Math.min(height - 1, Math.ceil(smoothElemRect.bottom + elemGlowRadius));

        for (let py = minY; py <= maxY; py++) {
          const ry =
            py < smoothElemRect.top
              ? smoothElemRect.top - py
              : py > smoothElemRect.bottom
              ? py - smoothElemRect.bottom
              : 0;
          const rySq = ry * ry;
          const rowOff = py * width;
          for (let px = minX; px <= maxX; px++) {
            const idx = rowOff + px;
            if (pixelMaskBuf[idx] === 0) continue;
            const rx =
              px < smoothElemRect.left
                ? smoothElemRect.left - px
                : px > smoothElemRect.right
                ? px - smoothElemRect.right
                : 0;
            const rectDistSq = rx * rx + rySq;
            if (rectDistSq >= elemGlowRadiusSq) continue;

            const u = 1 - Math.sqrt(rectDistSq) / elemGlowRadius;
            const falloff = POW_ELEM_LUT[Math.min(LUT_SIZE, Math.max(0, Math.round(u * LUT_SIZE)))];
            const densityGate = Math.min(1, combinedDensityBuf[idx] * 1.85);
            dynGlowBuf[idx] += falloff * smoothElemGlow * densityGate * 2.7;
            markDirty(idx);
          }
        }
      }

      const introEased =
        introProgress < 1 ? 1 - Math.pow(1 - introProgress, 2.3) : 1;

      // 6) Re-shade pixels (organic formation pass during intro, dirty-only fast path after)
      if (introProgress < 1) {
        for (let idx = 0; idx < totalPixels; idx++) {
          if (pixelMaskBuf[idx] === 1) {
            const density = combinedDensityBuf[idx];
            const startAt = (1 - density) * 0.34;
            const local = Math.max(0, Math.min(1, (introEased - startAt) / (1 - startAt)));
            const smoothLocal = local * local * (3 - 2 * local);

            if (smoothLocal <= 0.001) {
              frameData32[idx] = VOID_PIXEL_32;
            } else {
              const totalStarGlow =
                Math.min(3.3, (staticStarLightBuf[idx] + dynStarBuf[idx]) * 2.8) * smoothLocal;
              const rayStrength = dynRayBuf[idx] * smoothLocal;
              const fullLit =
                baseLevelBuf[idx] +
                totalStarGlow +
                dynGlowBuf[idx] * smoothLocal +
                rayStrength * 1.15;
              const formingLit = 0.05 + (fullLit - 0.05) * smoothLocal;

              frameData32[idx] = shadeNebulaPixel(idx, formingLit, rayStrength);
            }
          }
          dynStarBuf[idx] = 0;
          dynGlowBuf[idx] = 0;
          dynRayBuf[idx] = 0;
          dirtyMark[idx] = 0;
        }
      } else {
        for (let i = 0; i < dirtyCount; i++) {
          const idx = dirtyList[i];
          const totalStarGlow = Math.min(3.3, (staticStarLightBuf[idx] + dynStarBuf[idx]) * 2.8);
          const rayStrength = dynRayBuf[idx];
          const litLevel = baseLevelBuf[idx] + totalStarGlow + dynGlowBuf[idx] + rayStrength * 1.15;

          frameData32[idx] = shadeNebulaPixel(idx, litLevel, rayStrength);

          dynStarBuf[idx] = 0;
          dynGlowBuf[idx] = 0;
          dynRayBuf[idx] = 0;
          dirtyMark[idx] = 0;
        }
      }

      // 7) Blend fixed-world twinkling stars directly into pixel buffer
      const starIntroScale = Math.min(1, introEased * 1.3);
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (star.wx >= width || star.wy >= height) continue;

        const fadeIntro = Math.min(1, Math.max(0, (t - star.fadeDelay) / 28)) * starIntroScale;
        if (fadeIntro <= 0.01) continue;

        const starIdx = star.wy * width + star.wx;
        const cloudCover = Math.max(linearBuf[starIdx], volBuf[starIdx], scatterBuf[starIdx]);
        const twinkle = 0.28 + 0.72 * (0.5 + 0.5 * Math.sin(t * star.speed + star.phase));
        let alpha = star.baseAlpha * twinkle * fadeIntro;

        if (star.tier === 'small') {
          alpha *= Math.max(0.08, 1 - cloudCover * 0.86);
        }

        const rgb = STAR_RGB[star.colorIndex];
        if (star.tier === 'large') {
          if (star.shapeVariant === 0) {
            const a0 = Math.min(0.95, alpha);
            blendStarPixel(star.wx, star.wy, rgb, a0);
            blendStarPixel(star.wx + 1, star.wy, rgb, a0);
            blendStarPixel(star.wx, star.wy + 1, rgb, a0);
            blendStarPixel(star.wx + 1, star.wy + 1, rgb, a0);
          } else if (star.shapeVariant === 1) {
            blendStarPixel(star.wx, star.wy, rgb, Math.min(0.96, alpha * 1.15));
            const a1 = alpha * 0.48;
            blendStarPixel(star.wx - 1, star.wy, rgb, a1);
            blendStarPixel(star.wx + 1, star.wy, rgb, a1);
            blendStarPixel(star.wx, star.wy - 1, rgb, a1);
            blendStarPixel(star.wx, star.wy + 1, rgb, a1);
          } else {
            blendStarPixel(star.wx, star.wy, rgb, Math.min(0.98, alpha * 1.2));
            const a1 = alpha * 0.58;
            blendStarPixel(star.wx - 1, star.wy, rgb, a1);
            blendStarPixel(star.wx + 1, star.wy, rgb, a1);
            blendStarPixel(star.wx, star.wy - 1, rgb, a1);
            blendStarPixel(star.wx, star.wy + 1, rgb, a1);
            const a2 = alpha * 0.24;
            blendStarPixel(star.wx - 2, star.wy, rgb, a2);
            blendStarPixel(star.wx + 2, star.wy, rgb, a2);
            blendStarPixel(star.wx, star.wy - 2, rgb, a2);
            blendStarPixel(star.wx, star.wy + 2, rgb, a2);
          }
        } else if (star.tier === 'medium' && star.shapeVariant === 2) {
          blendStarPixel(star.wx, star.wy, rgb, alpha);
          blendStarPixel(star.wx + 1, star.wy, rgb, alpha);
        } else {
          blendStarPixel(star.wx, star.wy, rgb, alpha);
        }
      }

      // 8) Advance & blend shooting stars directly into pixel buffer
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life += 1;

        const progress = s.life / s.maxLife;
        if (progress >= 1) {
          shootingStars.splice(i, 1);
          continue;
        }

        const envelope = Math.pow(Math.sin(Math.PI * progress), 0.75) * introEased;
        const speedMag = Math.max(1, Math.hypot(s.vx, s.vy));
        const ux = s.vx / speedMag;
        const uy = s.vy / speedMag;
        const tailRgb = SHOOTING_STAR_RGB[s.colorIndex];
        const whiteRgb: RGB = [255, 255, 255];

        if (s.tier === 'large') {
          const tailSteps = 22;
          for (let step = 0; step < tailSteps; step++) {
            const tx = Math.round(s.x - ux * step * 0.95);
            const ty = Math.round(s.y - uy * step * 0.95);
            const stepAlpha = Math.max(0, envelope * (1 - step / tailSteps));
            const col = step < 3 ? whiteRgb : tailRgb;
            if (step === 0) {
              blendStarPixel(tx, ty, col, stepAlpha);
              blendStarPixel(tx + 1, ty, col, stepAlpha);
              blendStarPixel(tx, ty + 1, col, stepAlpha);
              blendStarPixel(tx + 1, ty + 1, col, stepAlpha);
              const flare = stepAlpha * 0.55;
              blendStarPixel(tx - 1, ty, col, flare);
              blendStarPixel(tx + 2, ty + 1, col, flare);
              blendStarPixel(tx, ty - 1, col, flare);
              blendStarPixel(tx + 1, ty + 2, col, flare);
            } else {
              blendStarPixel(tx, ty, col, stepAlpha);
            }
          }
        } else if (s.tier === 'medium') {
          const tailSteps = 13;
          for (let step = 0; step < tailSteps; step++) {
            const tx = Math.round(s.x - ux * step * 0.95);
            const ty = Math.round(s.y - uy * step * 0.95);
            const stepAlpha = Math.max(0, envelope * (1 - step / tailSteps));
            blendStarPixel(tx, ty, step === 0 ? whiteRgb : tailRgb, stepAlpha);
          }
        } else {
          const tailSteps = 7;
          const smallRgb: RGB = [235, 214, 247];
          for (let step = 0; step < tailSteps; step++) {
            const tx = Math.round(s.x - ux * step * 0.9);
            const ty = Math.round(s.y - uy * step * 0.9);
            const stepAlpha = Math.max(0, 0.48 * envelope * (1 - step / tailSteps));
            blendStarPixel(tx, ty, smallRgb, stepAlpha);
          }
        }
      }

      // Single Canvas2D blit per frame!
      ctx.putImageData(frameImageData, 0, 0);
    };

    handleResize();
    spawnNebulaRay(0.25);
    spawnNebulaRay(0.65);
    drawCosmos(0, false);

    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);

    if (prefersReducedMotion) {
      time = 40;
      bakeFullScreen(time);
      drawCosmos(time, false);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.visualViewport?.removeEventListener('resize', handleResize);
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('scroll', handleScroll);
        document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      };
    }

    let lastRenderTime = 0;
    let isRunning = false;
    let slowFrames = 0;
    let lagReported = false;
    const FRAME_INTERVAL_MS = 1000 / 28;

    const render = (now: number) => {
      if (pausedRef.current || document.hidden) {
        isRunning = false;
        animationFrameId = 0;
        return;
      }
      animationFrameId = requestAnimationFrame(render);
      if (now - lastRenderTime < FRAME_INTERVAL_MS) return;
      const prevRenderTime = lastRenderTime;
      lastRenderTime = now;

      if (introProgress < 1) {
        if (introStartTime === null) {
          introStartTime = now;
        }
        introProgress = Math.min(1, (now - introStartTime) / INTRO_DURATION_MS);
      }

      frameCount += 1;
      time += 0.65;

      if (mouseRef.current.active) {
        if (smoothMx < -1000) {
          smoothMx = mouseRef.current.x;
          smoothMy = mouseRef.current.y;
        } else {
          smoothMx += (mouseRef.current.x - smoothMx) * 0.28;
          smoothMy += (mouseRef.current.y - smoothMy) * 0.28;
        }
        smoothGlowStrength += (1 - smoothGlowStrength) * 0.2;
      } else {
        smoothGlowStrength += (0 - smoothGlowStrength) * 0.14;
      }

      const hoveredRect = hoveredRectCssRef.current;
      if (hoveredRect && hoveredElRef.current?.isConnected && mouseRef.current.active) {
        const targetLeft = hoveredRect.left / currentPixelScale;
        const targetTop = hoveredRect.top / currentPixelScale;
        const targetRight = hoveredRect.right / currentPixelScale;
        const targetBottom = hoveredRect.bottom / currentPixelScale;

        if (smoothElemGlow < 0.03) {
          smoothElemRect = {
            left: targetLeft,
            top: targetTop,
            right: targetRight,
            bottom: targetBottom,
          };
        } else {
          smoothElemRect.left += (targetLeft - smoothElemRect.left) * 0.32;
          smoothElemRect.top += (targetTop - smoothElemRect.top) * 0.32;
          smoothElemRect.right += (targetRight - smoothElemRect.right) * 0.32;
          smoothElemRect.bottom += (targetBottom - smoothElemRect.bottom) * 0.32;
        }
        smoothElemGlow += (1 - smoothElemGlow) * 0.22;
      } else {
        smoothElemGlow += (0 - smoothElemGlow) * 0.14;
      }

      nextRayDelay -= 1;
      if (nextRayDelay <= 0 && nebulaRays.length < 4) {
        spawnNebulaRay(0);
        nextRayDelay = 60 + Math.floor(Math.random() * 75);
      }
      for (let i = nebulaRays.length - 1; i >= 0; i--) {
        const ray = nebulaRays[i];
        ray.x += ray.ux * ray.driftSpeed;
        ray.y += ray.uy * ray.driftSpeed;
        ray.life += 1;
        if (ray.life >= ray.maxLife) {
          nebulaRays.splice(i, 1);
        }
      }

      nextMeteorDelay -= 1;
      if (nextMeteorDelay <= 0) {
        const tier: StarTier = Math.random() < 0.62 ? 'small' : 'medium';
        spawnShootingStar(tier);
        nextMeteorDelay = 28 + Math.floor(Math.random() * 52);
      }

      nextLargeMeteorDelay -= 1;
      if (nextLargeMeteorDelay <= 0) {
        spawnShootingStar('large');
        nextLargeMeteorDelay = 140 + Math.floor(Math.random() * 110);
      }

      const workStart = performance.now();
      drawCosmos(time, true);
      const workMs = performance.now() - workStart;

      if (!lagReported && frameCount > 15 && prevRenderTime > 0) {
        const frameDelta = now - prevRenderTime;
        if (workMs > 28 || frameDelta > 90) {
          slowFrames += 1;
          if (slowFrames >= 12) {
            lagReported = true;
            onLagRef.current?.();
          }
        } else if (slowFrames > 0) {
          slowFrames -= 1;
        }
      }
    };

    const startLoop = () => {
      if (pausedRef.current || document.hidden || isRunning) return;
      isRunning = true;
      lastRenderTime = 0;
      slowFrames = 0;
      animationFrameId = requestAnimationFrame(render);
    };

    const stopLoop = () => {
      if (!isRunning && !animationFrameId) return;
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoop();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startLoopRef.current = startLoop;
    stopLoopRef.current = stopLoop;
    startLoop();

    return () => {
      stopLoop();
      startLoopRef.current = null;
      stopLoopRef.current = null;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (paused) {
      stopLoopRef.current?.();
    } else {
      startLoopRef.current?.();
    }
  }, [enabled, paused]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
    >
      <canvas
        ref={canvasRef}
        className="block pixelated"
      />
    </div>
  );
}
