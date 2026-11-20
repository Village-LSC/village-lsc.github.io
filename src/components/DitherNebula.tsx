import React, { useEffect, useRef } from 'react';

interface DitherNebulaProps {
  enabled?: boolean;
  paused?: boolean;
  onDominantPaletteChange?: (rampIndex: number) => void;
}

export function DitherNebula({
  enabled = true,
  paused = false,
  onDominantPaletteChange,
}: DitherNebulaProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onPaletteChangeRef = useRef(onDominantPaletteChange);
  onPaletteChangeRef.current = onDominantPaletteChange;
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

    // Lock nebula pixel scale in physical screen units so browser zoom & page resize never shrink/enlarge the background
    const initialDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const TARGET_PHYSICAL_PIXEL = 6 * initialDpr;
    let currentPixelScale = TARGET_PHYSICAL_PIXEL / initialDpr;

    let width = 1;
    let height = 1;
    let animationFrameId = 0;

    // 4x4 Bayer matrix for Linear & Volumetric bands (crisp shelves + dithered edges)
    const BAYER_4X4 = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ];

    // 8x8 Bayer matrix for Scattered (maximum dithering) & touching-nebula dither blending
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

    // Fresh random generation on every visit
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

    // Shuffle all 8 dark cosmic color palettes and pick strictly 3 colors for this screen
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

    // Volumetric circular nebulae in fixed world tile space
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

      const aa = VAL[PERM[PERM[x0] + y0]];
      const ba = VAL[PERM[PERM[x1] + y0]];
      const ab = VAL[PERM[PERM[x0] + y1]];
      const bb = VAL[PERM[PERM[x1] + y1]];

      const nx0 = aa + u * (ba - aa);
      const nx1 = ab + u * (bb - ab);
      return nx0 + v * (nx1 - nx0);
    };

    const fbm2 = (x: number, y: number) =>
      noise2(x, y) * 0.66 + noise2(x * 2.05 + 13.7, y * 2.03 + 7.3) * 0.34;

    const fbm3 = (x: number, y: number) =>
      noise2(x, y) * 0.56 +
      noise2(x * 2.04 + 13.7, y * 2.02 + 7.3) * 0.29 +
      noise2(x * 4.09 + 27.1, y * 4.05 + 19.9) * 0.15;

    const starHexColors = [
      '#fbf7ff',
      '#d8b4fe',
      '#fde68a',
      '#7dd3fc',
      '#6ee7b7',
      '#fda4af',
      '#93c5fd',
      '#fdba74',
    ];

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
          ? Math.floor(rng() * 3) // 0: 2x2 block, 1: 3x3 cross, 2: 5x5 wide flare cross
          : tier === 'medium'
          ? Math.floor(rng() * 3) // 0/1: 1x1 bright, 2: 2x1 mini-sparkle
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
        colorIndex: Math.floor(rng() * starHexColors.length) || idx % starHexColors.length,
        glowPower: tier === 'large' ? 0.85 : tier === 'medium' ? 0.3 + rng() * 0.14 : 0,
        glowRadius: tier === 'large' ? 12 : tier === 'medium' ? 5 : 0,
      };
    });

    interface ShootingStar {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
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
      const colors = ['#fbf7ff', '#d8b4fe', '#a5b4fc', '#f5d0fe'];

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
        color: colors[Math.floor(Math.random() * colors.length)],
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

    let frameImageData = ctx.createImageData(width, height);
    let linearBuf = new Float32Array(width * height);
    let volBuf = new Float32Array(width * height);
    let scatterBuf = new Float32Array(width * height);
    let rayBuf = new Float32Array(width * height);
    let heightBuf = new Float32Array(width * height);
    let volLightBuf = new Float32Array(width * height);
    let staticStarLightBuf = new Float32Array(width * height);
    let starLightBuf = new Float32Array(width * height);
    let nebulaDirty = true;

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

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      currentPixelScale = TARGET_PHYSICAL_PIXEL / dpr;

      width = Math.max(1, Math.ceil(window.innerWidth / currentPixelScale));
      height = Math.max(1, Math.ceil(window.innerHeight / currentPixelScale));
      canvas.width = width;
      canvas.height = height;

      canvas.style.width = `${width * currentPixelScale}px`;
      canvas.style.height = `${height * currentPixelScale}px`;

      frameImageData = ctx.createImageData(width, height);
      linearBuf = new Float32Array(width * height);
      volBuf = new Float32Array(width * height);
      scatterBuf = new Float32Array(width * height);
      rayBuf = new Float32Array(width * height);
      heightBuf = new Float32Array(width * height);
      volLightBuf = new Float32Array(width * height);
      staticStarLightBuf = new Float32Array(width * height);
      starLightBuf = new Float32Array(width * height);
      nebulaDirty = true;
      hoveredRectCssRef.current = null;
    };

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

    handleResize();
    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(document.documentElement);

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);

    let time = 0;
    let frameCount = 0;
    let nextMeteorDelay = 30;
    let nextLargeMeteorDelay = 55;
    let nextRayDelay = 75;
    let smoothMx = -9999;
    let smoothMy = -9999;
    let smoothGlowStrength = 0;

    let smoothElemRect = { left: 0, top: 0, right: 0, bottom: 0 };
    let smoothElemGlow = 0;

    const addStarLightToBuf = (
      targetBuf: Float32Array,
      cx: number,
      cy: number,
      radius: number,
      strength: number
    ) => {
      if (radius <= 0 || strength <= 0) return;
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
          if (
            linearBuf[idx] <= 0.01 &&
            volBuf[idx] <= 0.01 &&
            scatterBuf[idx] <= 0.01
          ) {
            continue;
          }

          const dx = px - cx;
          const distSq = dx * dx + dySq;
          if (distSq >= rSq) continue;

          const falloff = 1 - Math.sqrt(distSq) / radius;
          targetBuf[idx] += falloff * falloff * strength;
        }
      }
    };

    const stampRayIntoBuf = (ray: NebulaRay) => {
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

          if (intensity > rayBuf[idx]) {
            rayBuf[idx] = intensity;
          }
        }
      }
    };

    // Recompute slow-drifting nebula noise geometry periodically (~10 Hz) for smooth, zero-lag performance
    const updateNebulaGeometry = (t: number) => {
      const driftX = t * 0.042 * driftDirX;
      const driftY = t * 0.042 * driftDirY;
      const volDriftX = t * 0.028 * driftDirX;
      const volDriftY = t * 0.028 * driftDirY;
      const scatterDriftX = t * 0.056 * driftDirX;
      const scatterDriftY = t * 0.056 * driftDirY;

      for (let y = 0; y < height; y++) {
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
          const linRidge = 1 - Math.abs(fbm2(ax * 1.35 + 1.8 * rx, ay * 1.35 + 1.8 * ry) * 2 - 1);
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

            const d = Math.min(1, Math.pow(radial, 0.78) * 1.05);
            if (d > volDensity) {
              volDensity = d;
              const invD = dist > 0.001 ? 1 / dist : 0;
              volDirBias = (dx * invD * lightUnitX + dy * invD * lightUnitY) * (0.4 + 0.6 * radial);
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

      // Cache static starlight contribution whenever geometry or static twinkle phase refreshes
      staticStarLightBuf.fill(0);
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (star.glowRadius <= 0 || star.wx >= width || star.wy >= height) continue;
        const fadeIntro = Math.min(1, Math.max(0, (t - star.fadeDelay) / 28 + 0.35));
        const twinkle = (0.58 + 0.42 * Math.sin(t * star.speed + star.phase)) * fadeIntro;
        addStarLightToBuf(staticStarLightBuf, star.wx, star.wy, star.glowRadius, star.glowPower * twinkle);
      }

      nebulaDirty = false;
    };

    let reportedRamp = -1;
    const rampWeights = new Float64Array(3);

    const drawCosmos = (t: number) => {
      if (nebulaDirty || frameCount % 3 === 0) {
        updateNebulaGeometry(t);
      }

      const data = frameImageData.data;
      const shouldMeasureDominant = reportedRamp === -1 || frameCount % 24 === 0;
      if (shouldMeasureDominant) {
        rampWeights[0] = 0;
        rampWeights[1] = 0;
        rampWeights[2] = 0;
      }

      // Update rays ("Луч")
      rayBuf.fill(0);
      for (let i = 0; i < nebulaRays.length; i++) {
        stampRayIntoBuf(nebulaRays[i]);
      }

      // Copy cached static starlight & add active flying stars' dynamic light
      starLightBuf.set(staticStarLightBuf);
      for (let i = 0; i < shootingStars.length; i++) {
        const s = shootingStars[i];
        const progress = s.life / s.maxLife;
        const smoothEnvelope = Math.pow(Math.sin(Math.PI * progress), 0.75);
        const radius = s.tier === 'large' ? 48 : s.tier === 'medium' ? 6 : 3;
        const power = s.tier === 'large' ? 1.55 : s.tier === 'medium' ? 0.68 : 0.14;
        addStarLightToBuf(starLightBuf, s.x, s.y, radius, power * smoothEnvelope);
      }

      const cursorGlowRadius = 26;
      const cursorGlowRadiusSq = cursorGlowRadius * cursorGlowRadius;
      const elemGlowRadius = 22;
      const elemGlowRadiusSq = elemGlowRadius * elemGlowRadius;
      const maxStop = PURPLE_RAMP.length - 1;

      const hasCursorGlow = smoothGlowStrength > 0.01;
      const hasElemGlow = smoothElemGlow > 0.01;

      for (let y = 0; y < height; y++) {
        const bayer4Row = BAYER_4X4[y & 3];
        const bayer8Row = BAYER_8X8[y & 7];
        const mixBayerRow = BAYER_8X8[(y + 3) & 7];
        const dustBayerRow = BAYER_8X8[(y + 5) & 7];
        const rowOffset = y * width;

        const sampleY = Math.max(0, Math.min(height - 1, y + chosenLight.dy));
        const sampleRowOffset = sampleY * width;

        for (let x = 0; x < width; x++) {
          const idx = rowOffset + x;
          const pixelOffset = idx << 2;

          const d0 = linearBuf[idx];
          const d1 = volBuf[idx];
          const d2 = scatterBuf[idx];

          if (d0 <= 0.01 && d1 <= 0.01 && d2 <= 0.01) {
            data[pixelOffset] = 9;
            data[pixelOffset + 1] = 2;
            data[pixelOffset + 2] = 18;
            data[pixelOffset + 3] = 255;
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
            const mixProb = Math.min(0.5, Math.pow(ratio * 2, 0.85) * 0.5);
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
                data[pixelOffset] = 9;
                data[pixelOffset + 1] = 2;
                data[pixelOffset + 2] = 18;
                data[pixelOffset + 3] = 255;
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

          const starGlow = Math.min(3.3, starLightBuf[idx] * 2.8);
          const rayStrength = rayBuf[idx];

          let cursorGlow = 0;
          if (hasCursorGlow) {
            const dx = x - smoothMx;
            const dy = y - smoothMy;
            const distSq = dx * dx + dy * dy;
            if (distSq < cursorGlowRadiusSq) {
              const dist = Math.sqrt(distSq);
              const radialFalloff = Math.pow(1 - dist / cursorGlowRadius, 1.5);
              cursorGlow = radialFalloff * smoothGlowStrength * Math.min(1, combinedDensity * 1.9);
            }
          }

          let elemGlow = 0;
          if (hasElemGlow) {
            const rx =
              x < smoothElemRect.left
                ? smoothElemRect.left - x
                : x > smoothElemRect.right
                ? x - smoothElemRect.right
                : 0;
            const ry =
              y < smoothElemRect.top
                ? smoothElemRect.top - y
                : y > smoothElemRect.bottom
                ? y - smoothElemRect.bottom
                : 0;
            const rectDistSq = rx * rx + ry * ry;
            if (rectDistSq < elemGlowRadiusSq) {
              const falloff = Math.pow(1 - Math.sqrt(rectDistSq) / elemGlowRadius, 1.65);
              elemGlow = falloff * smoothElemGlow * Math.min(1, combinedDensity * 1.85);
            }
          }

          const baseBand = 0.6 + combinedDensity * 3.5;
          const litLevel = Math.max(
            0.05,
            Math.min(
              maxStop - 0.001,
              baseBand +
                directionalLight +
                starGlow +
                rayStrength * 1.15 +
                cursorGlow * 2.8 +
                elemGlow * 2.7
            )
          );

          const baseIdx = Math.floor(litLevel);
          const frac = litLevel - baseIdx;

          let colorIdx: number;
          if (chosenType === 2) {
            const bayer8 = (bayer8Row[x & 7] + 0.5) / 64;
            colorIdx = frac > bayer8 ? Math.min(maxStop, baseIdx + 1) : baseIdx;
          } else {
            const ditherFrac = Math.max(0, Math.min(1, (frac - 0.16) / 0.68));
            const bayer4 = (bayer4Row[x & 3] + 0.5) / 16;
            colorIdx = ditherFrac > bayer4 ? Math.min(maxStop, baseIdx + 1) : baseIdx;
          }

          // Smooth color mixing + dithering where nebulae connect
          const primaryRgb = RAMPS[TYPE_RAMPS[chosenType]][colorIdx];
          let r = primaryRgb[0];
          let g = primaryRgb[1];
          let b = primaryRgb[2];

          const partnerType = chosenType === firstType ? secondType : firstType;
          const partnerDensity = chosenType === firstType ? secondD : firstD;
          if (partnerDensity > 0.02 && chosenDensity > 0.02) {
            const seamRatio = partnerDensity / (chosenDensity + partnerDensity);
            const blendWeight = Math.min(0.46, seamRatio * 0.92);
            const secondaryRgb = RAMPS[TYPE_RAMPS[partnerType]][colorIdx];
            r = Math.round(r + (secondaryRgb[0] - r) * blendWeight);
            g = Math.round(g + (secondaryRgb[1] - g) * blendWeight);
            b = Math.round(b + (secondaryRgb[2] - b) * blendWeight);
          }

          // Subtle pale lift along delicate "Луч" rays without adding a 4th hue
          if (rayStrength > 0.05) {
            const lift = Math.min(0.2, rayStrength * 0.18);
            r = Math.round(r + (235 - r) * lift);
            g = Math.round(g + (225 - g) * lift);
            b = Math.round(b + (248 - b) * lift);
          }

          data[pixelOffset] = r;
          data[pixelOffset + 1] = g;
          data[pixelOffset + 2] = b;
          data[pixelOffset + 3] = 255;

          if (shouldMeasureDominant && colorIdx > 0) {
            rampWeights[chosenType] += 1 + colorIdx * 0.45;
          }
        }
      }

      if (shouldMeasureDominant) {
        let bestType = 0;
        if (rampWeights[1] > rampWeights[bestType]) bestType = 1;
        if (rampWeights[2] > rampWeights[bestType]) bestType = 2;

        if (reportedRamp === -1) {
          reportedRamp = TYPE_RAMPS[bestType];
          onPaletteChangeRef.current?.(reportedRamp);
        } else {
          const currentTypeIdx = TYPE_RAMPS.indexOf(reportedRamp);
          const currentWeight = currentTypeIdx >= 0 ? rampWeights[currentTypeIdx] : 0;
          if (
            TYPE_RAMPS[bestType] !== reportedRamp &&
            rampWeights[bestType] > currentWeight * 1.15
          ) {
            reportedRamp = TYPE_RAMPS[bestType];
            onPaletteChangeRef.current?.(reportedRamp);
          }
        }
      }

      ctx.putImageData(frameImageData, 0, 0);

      // Fixed-world twinkling stars across all colors and varied sizes
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (star.wx >= width || star.wy >= height) continue;

        const fadeIntro = Math.min(1, Math.max(0, (t - star.fadeDelay) / 28));
        if (fadeIntro <= 0.01) continue;

        const starIdx = star.wy * width + star.wx;
        const cloudCover = Math.max(linearBuf[starIdx], volBuf[starIdx], scatterBuf[starIdx]);

        const twinkle = 0.28 + 0.72 * (0.5 + 0.5 * Math.sin(t * star.speed + star.phase));
        let alpha = star.baseAlpha * twinkle * fadeIntro;

        if (star.tier === 'small') {
          alpha *= Math.max(0.08, 1 - cloudCover * 0.86);
        }

        ctx.fillStyle = starHexColors[star.colorIndex];
        if (star.tier === 'large') {
          if (star.shapeVariant === 0) {
            // 2x2 glowing star cluster
            ctx.globalAlpha = Math.min(0.95, alpha);
            ctx.fillRect(star.wx, star.wy, 2, 2);
          } else if (star.shapeVariant === 1) {
            // 3x3 4-point cross sparkle
            ctx.globalAlpha = Math.min(0.96, alpha * 1.15);
            ctx.fillRect(star.wx, star.wy, 1, 1);
            ctx.globalAlpha = alpha * 0.48;
            ctx.fillRect(star.wx - 1, star.wy, 1, 1);
            ctx.fillRect(star.wx + 1, star.wy, 1, 1);
            ctx.fillRect(star.wx, star.wy - 1, 1, 1);
            ctx.fillRect(star.wx, star.wy + 1, 1, 1);
          } else {
            // 5x5 wide beacon cross sparkle
            ctx.globalAlpha = Math.min(0.98, alpha * 1.2);
            ctx.fillRect(star.wx, star.wy, 1, 1);
            ctx.globalAlpha = alpha * 0.58;
            ctx.fillRect(star.wx - 1, star.wy, 1, 1);
            ctx.fillRect(star.wx + 1, star.wy, 1, 1);
            ctx.fillRect(star.wx, star.wy - 1, 1, 1);
            ctx.fillRect(star.wx, star.wy + 1, 1, 1);
            ctx.globalAlpha = alpha * 0.24;
            ctx.fillRect(star.wx - 2, star.wy, 1, 1);
            ctx.fillRect(star.wx + 2, star.wy, 1, 1);
            ctx.fillRect(star.wx, star.wy - 2, 1, 1);
            ctx.fillRect(star.wx, star.wy + 2, 1, 1);
          }
        } else if (star.tier === 'medium' && star.shapeVariant === 2) {
          // 2x1 bright medium star
          ctx.globalAlpha = alpha;
          ctx.fillRect(star.wx, star.wy, 2, 1);
        } else {
          ctx.globalAlpha = alpha;
          ctx.fillRect(star.wx, star.wy, 1, 1);
        }
      }
      ctx.globalAlpha = 1;
    };

    updateNebulaGeometry(0);
    spawnNebulaRay(0.25);
    spawnNebulaRay(0.65);
    drawCosmos(0);

    if (prefersReducedMotion) {
      drawCosmos(40);
      return () => {
        resizeObserver.disconnect();
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
    const FRAME_INTERVAL_MS = 1000 / 28; // Smooth 28fps pixel-art cadence without pegging CPU

    const render = (now: number) => {
      if (pausedRef.current) {
        isRunning = false;
        animationFrameId = 0;
        return;
      }
      animationFrameId = requestAnimationFrame(render);
      if (now - lastRenderTime < FRAME_INTERVAL_MS) return;
      lastRenderTime = now;

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

      drawCosmos(time);

      // Smooth fade-in and fade-out for flying stars across all 3 size tiers
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

        const envelope = Math.pow(Math.sin(Math.PI * progress), 0.75);
        const speedMag = Math.max(1, Math.hypot(s.vx, s.vy));
        const ux = s.vx / speedMag;
        const uy = s.vy / speedMag;

        if (s.tier === 'large') {
          const tailSteps = 22;
          for (let step = 0; step < tailSteps; step++) {
            const tx = Math.round(s.x - ux * step * 0.95);
            const ty = Math.round(s.y - uy * step * 0.95);
            const stepAlpha = Math.max(0, envelope * (1 - step / tailSteps));
            ctx.globalAlpha = stepAlpha;
            ctx.fillStyle = step < 3 ? '#ffffff' : s.color;
            if (step === 0) {
              ctx.fillRect(tx, ty, 2, 2);
              ctx.globalAlpha = stepAlpha * 0.55;
              ctx.fillRect(tx - 1, ty, 1, 1);
              ctx.fillRect(tx + 2, ty + 1, 1, 1);
              ctx.fillRect(tx, ty - 1, 1, 1);
              ctx.fillRect(tx + 1, ty + 2, 1, 1);
            } else {
              ctx.fillRect(tx, ty, 1, 1);
            }
          }
          ctx.globalAlpha = 1;
        } else if (s.tier === 'medium') {
          const tailSteps = 13;
          for (let step = 0; step < tailSteps; step++) {
            const tx = Math.round(s.x - ux * step * 0.95);
            const ty = Math.round(s.y - uy * step * 0.95);
            const stepAlpha = Math.max(0, envelope * (1 - step / tailSteps));
            ctx.globalAlpha = stepAlpha;
            ctx.fillStyle = step === 0 ? '#ffffff' : s.color;
            ctx.fillRect(tx, ty, 1, 1);
          }
          ctx.globalAlpha = 1;
        } else {
          const tailSteps = 7;
          for (let step = 0; step < tailSteps; step++) {
            const tx = Math.round(s.x - ux * step * 0.9);
            const ty = Math.round(s.y - uy * step * 0.9);
            const stepAlpha = Math.max(0, 0.48 * envelope * (1 - step / tailSteps));
            ctx.globalAlpha = stepAlpha;
            ctx.fillStyle = '#ebd6f7';
            ctx.fillRect(tx, ty, 1, 1);
          }
          ctx.globalAlpha = 1;
        }
      }
    };

    const startLoop = () => {
      if (pausedRef.current || isRunning) return;
      isRunning = true;
      lastRenderTime = 0;
      animationFrameId = requestAnimationFrame(render);
    };

    const stopLoop = () => {
      if (!isRunning && !animationFrameId) return;
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    };

    startLoopRef.current = startLoop;
    stopLoopRef.current = stopLoop;
    startLoop();

    return () => {
      stopLoop();
      startLoopRef.current = null;
      stopLoopRef.current = null;
      resizeObserver.disconnect();
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
