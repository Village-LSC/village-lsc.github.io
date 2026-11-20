import React, { useEffect, useRef } from 'react';

type ShapeId =
  | 'question'
  | 'cube'
  | 'sphere'
  | 'fire'
  | 'triangle'
  | 'letter'
  | 'star'
  | 'paw';

interface ShapeTarget {
  x: number;
  y: number;
  intensity: number; // 0.35 .. 1.0
}

interface SwarmParticle {
  x: number;
  y: number;
  tx: number;
  ty: number;
  tIntensity: number;
  orbitAngle: number;
  orbitRadius: number;
  orbitSpeed: number;
  driftPhase: number;
  stagger: number;
  active: boolean;
}

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function sampleBitmap(rows: string[]): ShapeTarget[] {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const cx = (w - 1) * 0.5;
  const cy = (h - 1) * 0.5;
  const targets: ShapeTarget[] = [];

  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const intensity = ch === '3' ? 1.0 : ch === '2' ? 0.72 : 0.45;
      targets.push({ x: x - cx, y: y - cy, intensity });
    }
  }
  return targets;
}

function generateQuestionTargets(): ShapeTarget[] {
  return sampleBitmap([
    '....22222....',
    '..223333322..',
    '.23332223332.',
    '.2332...2332.',
    '.222.....332.',
    '........2332.',
    '.......2332..',
    '......2332...',
    '.....2332....',
    '.....232.....',
    '.....222.....',
    '.............',
    '.....232.....',
    '.....333.....',
    '.....222.....',
  ]);
}

function generateCubeTargets(): ShapeTarget[] {
  const targets: ShapeTarget[] = [];
  // Crisp isometric pixel cube (top face bright, left mid, right shaded, crisp ridge edges)
  const size = 10;
  for (let py = -11; py <= 11; py++) {
    for (let px = -11; px <= 11; px++) {
      // Top diamond face: |px|/10 + |py + 5|/5 <= 1
      const topU = Math.abs(px) / size + Math.abs(py + 5) / 5;
      if (topU <= 1.02) {
        const isEdge = topU >= 0.84;
        targets.push({ x: px, y: py, intensity: isEdge ? 1.0 : 0.88 });
        continue;
      }

      // Left face: px in [-10, 0], top edge py >= -5 - (px + 10)*0.5 => wait: center is (0,0), bottom is (0,10)
      if (px >= -size && px <= 0) {
        const topEdge = px * 0.5;
        const botEdge = 10 + px * 0.5;
        if (py >= topEdge && py <= botEdge) {
          const isEdge =
            px === -size || px === 0 || py - topEdge < 1.1 || botEdge - py < 1.1;
          targets.push({ x: px, y: py, intensity: isEdge ? 0.98 : 0.64 });
          continue;
        }
      }

      // Right face: px in [1, 10]
      if (px > 0 && px <= size) {
        const topEdge = -px * 0.5;
        const botEdge = 10 - px * 0.5;
        if (py >= topEdge && py <= botEdge) {
          const isEdge =
            px === size || py - topEdge < 1.1 || botEdge - py < 1.1;
          if (isEdge || ((px + py) & 1) === 0) {
            targets.push({ x: px, y: py, intensity: isEdge ? 0.92 : 0.42 });
          }
        }
      }
    }
  }
  return targets;
}

function generateSphereTargets(): ShapeTarget[] {
  const targets: ShapeTarget[] = [];
  const r = 10.2;
  const lx = -0.48;
  const ly = -0.56;
  const lz = 0.68;

  for (let py = -11; py <= 11; py++) {
    for (let px = -11; px <= 11; px++) {
      const distSq = px * px + py * py;
      if (distSq > r * r) continue;

      const nx = px / r;
      const ny = py / r;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const dot = Math.max(0, nx * lx + ny * ly + nz * lz);
      const isRim = distSq > (r - 1.25) * (r - 1.25);

      const bayer = (BAYER_4X4[(py + 16) & 3][(px + 16) & 3] + 0.5) / 16;
      if (isRim || dot > bayer * 0.72 + 0.08) {
        const intensity = dot > 0.76 ? 1.0 : dot > 0.42 ? 0.78 : isRim ? 0.52 : 0.48;
        targets.push({ x: px, y: py, intensity });
      }
    }
  }
  return targets;
}

function generateFireTargets(): ShapeTarget[] {
  return sampleBitmap([
    '.......2.......',
    '......232......',
    '......232......',
    '.....2332..1...',
    '....23332.22...',
    '....23332232...',
    '..1.23333332...',
    '.22.233333321..',
    '.232233333322..',
    '.233333333332..',
    '12333333333321.',
    '23333333333332.',
    '23333222333332.',
    '23332111233332.',
    '.23321.123332..',
    '.23321.123332..',
    '..232...2332...',
    '...22...222....',
  ]);
}

function generateTriangleTargets(): ShapeTarget[] {
  const targets: ShapeTarget[] = [];
  const halfH = 10;
  for (let row = 0; row <= halfH * 2; row++) {
    const py = row - halfH;
    const halfSpan = Math.round((row / (halfH * 2)) * 11);
    for (let px = -halfSpan; px <= halfSpan; px++) {
      const isBorder =
        row <= 1 || row >= halfH * 2 - 1 || Math.abs(px) >= halfSpan - 1;
      if (isBorder) {
        targets.push({ x: px, y: py, intensity: 1.0 });
      } else if (((px + py) & 1) === 0 && py > -4) {
        targets.push({ x: px, y: py, intensity: 0.48 });
      }
    }
  }
  return targets;
}

function generateLetterTargets(): ShapeTarget[] {
  // Bold geometric pixel letter "A"
  return sampleBitmap([
    '......2332......',
    '.....233332.....',
    '....23333332....',
    '....23322332....',
    '...2332..2332...',
    '...2332..2332...',
    '..2332....2332..',
    '..2332....2332..',
    '.23333333333332.',
    '.23333333333332.',
    '.2332......2332.',
    '2332........2332',
    '2332........2332',
    '2332........2332',
    '2222........2222',
  ]);
}

function generateStarTargets(): ShapeTarget[] {
  const targets: ShapeTarget[] = [];
  const outerR = 11;
  const innerR = 4.6;
  const vertices: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? outerR : innerR;
    vertices.push({ x: Math.cos(angle) * rad, y: Math.sin(angle) * rad });
  }

  const pointInPoly = (x: number, y: number) => {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x;
      const yi = vertices[i].y;
      const xj = vertices[j].x;
      const yj = vertices[j].y;
      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-6) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  for (let py = -12; py <= 12; py++) {
    for (let px = -12; px <= 12; px++) {
      if (!pointInPoly(px, py)) continue;
      const onEdge =
        !pointInPoly(px + 1, py) ||
        !pointInPoly(px - 1, py) ||
        !pointInPoly(px, py + 1) ||
        !pointInPoly(px, py - 1);
      const dist = Math.hypot(px, py);
      const intensity = onEdge ? 1.0 : dist < 3.2 ? 0.95 : 0.65;
      targets.push({ x: px, y: py, intensity });
    }
  }
  return targets;
}

function generatePawTargets(): ShapeTarget[] {
  // Secret 1% chance furry paw!
  return sampleBitmap([
    '.......222...222.......',
    '......23332.23332......',
    '......23332.23332......',
    '.222..23332.23332..222.',
    '23332..222...222..23332',
    '23332.............23332',
    '23332.............23332',
    '.222...............222.',
    '.......................',
    '........2222222........',
    '......22333333322......',
    '.....2333333333332.....',
    '....233333333333332....',
    '....233333333333332....',
    '....233333333333332....',
    '....233333222333332....',
    '.....23332...23332.....',
    '......222.....222......',
  ]);
}

const SHAPE_LIBRARY: Record<ShapeId, ShapeTarget[]> = {
  question: generateQuestionTargets(),
  cube: generateCubeTargets(),
  sphere: generateSphereTargets(),
  fire: generateFireTargets(),
  triangle: generateTriangleTargets(),
  letter: generateLetterTargets(),
  star: generateStarTargets(),
  paw: generatePawTargets(),
};

const REGULAR_SHAPES: ShapeId[] = [
  'cube',
  'sphere',
  'fire',
  'triangle',
  'letter',
  'star',
  'question',
];

export function ParticleQuestionMark() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const PIXEL_SIZE = 5;
    let width = 80;
    let height = 56;
    let frameData = ctx.createImageData(width, height);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(48, Math.round(rect.width / PIXEL_SIZE));
      height = Math.max(36, Math.round(rect.height / PIXEL_SIZE));
      canvas.width = width;
      canvas.height = height;
      frameData = ctx.createImageData(width, height);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // Lightweight deterministic 2D value noise for the mini-nebula cloud
    const perm = new Uint8Array(512);
    const vals = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      perm[i] = i;
      vals[i] = Math.random();
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = perm[i];
      perm[i] = perm[j];
      perm[j] = tmp;
    }
    for (let i = 0; i < 256; i++) {
      perm[i + 256] = perm[i];
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
      const aa = vals[perm[perm[x0] + y0]];
      const ba = vals[perm[perm[x1] + y0]];
      const ab = vals[perm[perm[x0] + y1]];
      const bb = vals[perm[perm[x1] + y1]];
      return aa + u * (ba - aa) + v * (ab + u * (bb - ab) - (aa + u * (ba - aa)));
    };

    const MAX_PARTICLES = 290;
    const particles: SwarmParticle[] = Array.from({ length: MAX_PARTICLES }, (_, i) => ({
      x: (Math.random() - 0.5) * 26,
      y: (Math.random() - 0.5) * 20,
      tx: 0,
      ty: 0,
      tIntensity: 0.7,
      orbitAngle: Math.random() * Math.PI * 2,
      orbitRadius: 4 + Math.pow(Math.random(), 0.7) * 20,
      orbitSpeed: (0.014 + Math.random() * 0.022) * (i % 2 === 0 ? 1 : -0.7),
      driftPhase: Math.random() * Math.PI * 2,
      stagger: Math.random() * 0.35,
      active: false,
    }));

    let currentShape: ShapeId = 'question';
    let lastRegularShape: ShapeId = 'question';

    const assignShapeTargets = (shape: ShapeId) => {
      currentShape = shape;
      const rawTargets = SHAPE_LIBRARY[shape];
      // Shuffle target order so particles weave organically across the shape
      const shuffled = [...rawTargets];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = tmp;
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (i < shuffled.length) {
          p.tx = shuffled[i].x;
          p.ty = shuffled[i].y;
          p.tIntensity = shuffled[i].intensity;
          p.active = true;
        } else {
          // Excess particles remain as subtle outer nebula stardust
          p.active = false;
        }
      }
    };

    const pickNextShape = (): ShapeId => {
      // Exact 1% chance to transform into a cute furry paw
      if (Math.random() < 0.01) {
        return 'paw';
      }
      const candidates = REGULAR_SHAPES.filter((s) => s !== lastRegularShape);
      const next = candidates[Math.floor(Math.random() * candidates.length)];
      lastRegularShape = next;
      return next;
    };

    assignShapeTargets('question');

    // Read adaptive theme glow RGB for subtle cosmic tint in the mini-nebula mist
    let tintRgb: [number, number, number] = [166, 116, 222];
    const refreshThemeTint = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue('--ui-glow-rgb')
        .trim();
      if (!raw) return;
      const parts = raw.split(',').map((n) => Number(n.trim()));
      if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
        tintRgb = [parts[0], parts[1], parts[2]];
      }
    };

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Lifecycle timings in seconds
    const SWIRL_DUR = 1.25;
    const FORM_DUR = 1.15;
    const HOLD_DUR = 2.45;
    const DISSOLVE_DUR = 1.05;
    const CYCLE_DUR = SWIRL_DUR + FORM_DUR + HOLD_DUR + DISSOLVE_DUR;

    let simTime = prefersReducedMotion ? SWIRL_DUR + FORM_DUR + 0.5 : 0.45;
    let cycleElapsed = simTime;
    let frameTick = 0;
    let isVisible = true;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    const drawFrame = () => {
      const data = frameData.data;
      data.fill(0);

      const cx = Math.floor(width * 0.5);
      const cy = Math.floor(height * 0.5);
      const minDim = Math.min(width, height);
      const shapeScale = Math.max(0.85, Math.min(1.42, minDim / 34));

      // Compute phase progress: 0 = loose mini-nebula, 1 = fully formed object
      let formation = 0;
      if (cycleElapsed < SWIRL_DUR) {
        formation = 0;
      } else if (cycleElapsed < SWIRL_DUR + FORM_DUR) {
        const u = (cycleElapsed - SWIRL_DUR) / FORM_DUR;
        formation = u * u * (3 - 2 * u);
      } else if (cycleElapsed < SWIRL_DUR + FORM_DUR + HOLD_DUR) {
        formation = 1;
      } else {
        const u = (cycleElapsed - SWIRL_DUR - FORM_DUR - HOLD_DUR) / DISSOLVE_DUR;
        formation = 1 - u * u * (3 - 2 * u);
      }

      // 1) Draw miniature Bayer-dithered nebula mist around the center
      const nebRx = 18 * shapeScale * (1.16 - 0.24 * formation);
      const nebRy = 14 * shapeScale * (1.16 - 0.24 * formation);
      const minX = Math.max(0, Math.floor(cx - nebRx - 3));
      const maxX = Math.min(width - 1, Math.ceil(cx + nebRx + 3));
      const minY = Math.max(0, Math.floor(cy - nebRy - 3));
      const maxY = Math.min(height - 1, Math.ceil(cy + nebRy + 3));

      const swirlX = simTime * 0.55;
      const swirlY = simTime * 0.35;

      for (let py = minY; py <= maxY; py++) {
        const dy = (py - cy) / nebRy;
        const bayerRow = BAYER_4X4[py & 3];
        const rowOffset = py * width;
        for (let px = minX; px <= maxX; px++) {
          const dx = (px - cx) / nebRx;
          const dist = Math.hypot(dx, dy);
          if (dist >= 1.05) continue;

          // Swirling radial cloud mask + pixel noise
          const angle = Math.atan2(dy, dx);
          const n =
            noise2(px * 0.14 + swirlX + Math.cos(angle) * 0.6, py * 0.14 - swirlY + Math.sin(angle) * 0.6) *
              0.68 +
            noise2(px * 0.28 - swirlX * 0.7, py * 0.28 + swirlY * 0.7) * 0.32;

          const radialFalloff = Math.max(0, 1 - dist);
          const density = radialFalloff * (0.42 + 0.85 * n) * (0.72 + 0.28 * (1 - formation));
          const bayer = (bayerRow[px & 3] + 0.5) / 16;

          if (density > bayer * 0.92 + 0.14) {
            const idx = (rowOffset + px) << 2;
            const brightMix = Math.min(1, density * 1.1);
            // Soft cosmic mist blending active UI tint toward pale stardust white
            data[idx] = Math.round(tintRgb[0] + (248 - tintRgb[0]) * brightMix * 0.58);
            data[idx + 1] = Math.round(tintRgb[1] + (244 - tintRgb[1]) * brightMix * 0.58);
            data[idx + 2] = Math.round(tintRgb[2] + (255 - tintRgb[2]) * brightMix * 0.62);
            data[idx + 3] = Math.round(Math.min(185, 55 + density * 155));
          }
        }
      }

      // 2) Draw crisp white cosmic particles forming the current shape
      const isPaw = currentShape === 'paw';
      const isFire = currentShape === 'fire';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.orbitAngle += p.orbitSpeed;

        // Loose swirling mini-nebula coordinates
        const swirlR = p.orbitRadius * (0.78 + 0.22 * Math.sin(simTime * 1.1 + p.driftPhase));
        const ox = Math.cos(p.orbitAngle) * swirlR * 1.15;
        const oy = Math.sin(p.orbitAngle) * swirlR * 0.88;

        let targetX = ox;
        let targetY = oy;
        let alpha = 0.24 + 0.34 * (0.5 + 0.5 * Math.sin(simTime * 2.1 + p.driftPhase));

        if (p.active) {
          const localProgress = Math.max(
            0,
            Math.min(1, (formation * (1 + p.stagger) - p.stagger * 0.45))
          );
          const ease = localProgress * localProgress * (3 - 2 * localProgress);

          let fx = p.tx * shapeScale;
          let fy = p.ty * shapeScale;

          if (isFire && ease > 0.4) {
            // Gentle living flame flicker
            const heightRatio = Math.max(0, 0.5 - p.ty / 18);
            fx += Math.sin(simTime * 7.5 + p.ty * 0.55 + p.driftPhase) * 0.85 * heightRatio * ease;
            fy += Math.cos(simTime * 6.2 + p.tx * 0.4) * 0.45 * heightRatio * ease;
          }

          targetX = ox + (fx - ox) * ease;
          targetY = oy + (fy - oy) * ease;

          const shimmer = 0.88 + 0.12 * Math.sin(simTime * 2.8 + p.driftPhase);
          alpha = alpha + (p.tIntensity * shimmer - alpha) * ease;
        }

        // Smooth particle inertia
        p.x += (targetX - p.x) * 0.22;
        p.y += (targetY - p.y) * 0.22;

        const px = Math.round(cx + p.x);
        const py = Math.round(cy + p.y);
        if (px < 0 || px >= width || py < 0 || py >= height) continue;

        const idx = (py * width + px) << 2;
        const aByte = Math.max(data[idx + 3], Math.min(255, Math.round(alpha * 255)));

        if (isPaw && p.active && formation > 0.5 && p.tIntensity >= 0.9) {
          // Subtle warm pastel blush on the secret furry paw pads
          data[idx] = 255;
          data[idx + 1] = 226;
          data[idx + 2] = 242;
        } else {
          data[idx] = 255;
          data[idx + 1] = p.active ? 252 : 246;
          data[idx + 2] = 255;
        }
        data[idx + 3] = aByte;
      }

      ctx.putImageData(frameData, 0, 0);
    };

    refreshThemeTint();
    drawFrame();

    if (prefersReducedMotion) {
      return () => {
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
      };
    }

    let rafId = 0;
    let lastTime = 0;
    const FRAME_MS = 1000 / 24;

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      if (!isVisible) return;
      if (now - lastTime < FRAME_MS) return;

      const dt = lastTime ? Math.min(0.08, (now - lastTime) / 1000) : 1 / 24;
      lastTime = now;

      frameTick += 1;
      if (frameTick % 18 === 0) {
        refreshThemeTint();
      }

      simTime += dt;
      cycleElapsed += dt;

      if (cycleElapsed >= CYCLE_DUR) {
        cycleElapsed -= CYCLE_DUR;
        assignShapeTargets(pickNextShape());
      }

      drawFrame();
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="w-full h-full block pixelated"
      />
    </div>
  );
}
