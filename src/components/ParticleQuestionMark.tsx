import React, { useEffect, useRef } from 'react';

type ShapeId =
  | 'question'
  | 'cube'
  | 'sphere'
  | 'cylinder'
  | 'fire'
  | 'triangle'
  | 'letter'
  | 'star'
  | 'skull'
  | 'sword'
  | 'clock'
  | 'paw';

interface ShapeTarget {
  x: number;
  y: number;
  intensity: number;
}

interface SwarmParticle {
  x: number;
  y: number;
  orbitR: number;
  baseAngle: number;
  orbitSpeed: number;
  isArmMember: boolean;
  orbitEcc: number;
  radialAmp: number;
  radialFreq: number;
  tx: number;
  ty: number;
  tIntensity: number;
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
      const intensity = ch === '3' ? 1.0 : ch === '2' ? 0.8 : 0.52;
      targets.push({ x: Math.round(x - cx), y: Math.round(y - cy), intensity });
    }
  }
  return targets;
}

function generateQuestionTargets(): ShapeTarget[] {
  return sampleBitmap([
    '....23332....',
    '..233333332..',
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
  const size = 10;
  for (let py = -11; py <= 11; py++) {
    for (let px = -11; px <= 11; px++) {
      const topU = Math.abs(px) / size + Math.abs(py + 5) / 5;
      if (topU <= 1.02) {
        const isEdge = topU >= 0.84;
        targets.push({ x: px, y: py, intensity: isEdge ? 1.0 : 0.88 });
        continue;
      }

      if (px >= -size && px <= 0) {
        const topEdge = px * 0.5;
        const botEdge = 10 + px * 0.5;
        if (py >= topEdge && py <= botEdge) {
          const isEdge =
            px === -size || px === 0 || py - topEdge < 1.1 || botEdge - py < 1.1;
          targets.push({ x: px, y: py, intensity: isEdge ? 1.0 : 0.68 });
          continue;
        }
      }

      if (px > 0 && px <= size) {
        const topEdge = -px * 0.5;
        const botEdge = 10 - px * 0.5;
        if (py >= topEdge && py <= botEdge) {
          const isEdge =
            px === size || py - topEdge < 1.1 || botEdge - py < 1.1;
          if (isEdge || ((px + py) & 1) === 0) {
            targets.push({ x: px, y: py, intensity: isEdge ? 0.96 : 0.48 });
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
      if (isRim || dot > bayer * 0.7 + 0.08) {
        const intensity = dot > 0.76 ? 1.0 : dot > 0.42 ? 0.8 : isRim ? 0.6 : 0.52;
        targets.push({ x: px, y: py, intensity });
      }
    }
  }
  return targets;
}

function generateCylinderTargets(): ShapeTarget[] {
  const targets: ShapeTarget[] = [];
  const rx = 8.5;
  const ry = 3.2;
  const halfH = 6.5;

  for (let py = -11; py <= 11; py++) {
    for (let px = -10; px <= 10; px++) {
      const topDy = (py + halfH) / ry;
      const dxNorm = px / rx;
      const topEll = dxNorm * dxNorm + topDy * topDy;
      if (topEll <= 1.04) {
        const isRim = topEll >= 0.72;
        targets.push({ x: px, y: py, intensity: isRim ? 1.0 : 0.86 });
        continue;
      }

      if (Math.abs(px) <= rx) {
        const arcOffset = ry * Math.sqrt(Math.max(0, 1 - dxNorm * dxNorm));
        const bottomY = halfH + arcOffset;
        if (py > -halfH && py <= bottomY) {
          const isSideEdge = Math.abs(px) >= rx - 1.1;
          const isBottomEdge = bottomY - py < 1.15;
          if (isSideEdge || isBottomEdge) {
            targets.push({ x: px, y: py, intensity: 0.98 });
          } else {
            const light = Math.max(0, 0.72 - dxNorm * 0.55);
            const bayer = (BAYER_4X4[(py + 16) & 3][(px + 16) & 3] + 0.5) / 16;
            if (light > bayer * 0.78) {
              targets.push({
                x: px,
                y: py,
                intensity: light > 0.82 ? 0.92 : light > 0.48 ? 0.68 : 0.48,
              });
            }
          }
        }
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
        targets.push({ x: px, y: py, intensity: 0.54 });
      }
    }
  }
  return targets;
}

function generateLetterTargets(): ShapeTarget[] {
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
      const intensity = onEdge ? 1.0 : dist < 3.2 ? 0.95 : 0.7;
      targets.push({ x: px, y: py, intensity });
    }
  }
  return targets;
}

function generateSkullTargets(): ShapeTarget[] {
  return sampleBitmap([
    '.....233333332.....',
    '...2333333333332...',
    '..233333333333332..',
    '.23333333333333332.',
    '.23333333333333332.',
    '.23333333333333332.',
    '.2333....333....32.',
    '.233.....333.....2.',
    '.233.....333.....2.',
    '.2333....333....32.',
    '..2333332.2333332..',
    '...23333...33332...',
    '....23333333332....',
    '....232.323.232....',
    '....232.323.232....',
    '.....22.222.22.....',
  ]);
}

function generateSwordTargets(): ShapeTarget[] {
  const targets: ShapeTarget[] = [];
  for (let py = -11; py <= 11; py++) {
    for (let px = -11; px <= 11; px++) {
      const u = (px - py) * 0.7071;
      const v = (px + py) * 0.7071;
      const absV = Math.abs(v);

      if (u >= -3.5 && u <= 11.8) {
        const maxW = u > 8.6 ? Math.max(0.35, (11.8 - u) * 0.62) : 1.85;
        if (absV <= maxW) {
          const intensity = v <= 0.15 ? 1.0 : 0.74;
          targets.push({ x: px, y: py, intensity });
          continue;
        }
      }

      if (u >= -5.4 && u < -3.5 && absV <= 5.2) {
        const intensity = absV > 3.8 || u < -4.6 ? 1.0 : 0.86;
        targets.push({ x: px, y: py, intensity });
        continue;
      }

      if (u >= -9.2 && u < -5.4 && absV <= 1.15) {
        targets.push({ x: px, y: py, intensity: 0.68 });
        continue;
      }

      if (u >= -11.8 && u < -9.2 && absV <= 2.3) {
        targets.push({ x: px, y: py, intensity: 0.98 });
      }
    }
  }
  return targets;
}

function generateClockTargets(): ShapeTarget[] {
  const targets: ShapeTarget[] = [];
  const outerR = 9.8;
  const innerR = 7.9;

  for (let py = -12; py <= 11; py++) {
    for (let px = -11; px <= 11; px++) {
      if (py >= -12 && py <= -10 && Math.abs(px) <= 2) {
        if (py === -12 || Math.abs(px) === 2 || Math.abs(px) === 0) {
          targets.push({ x: px, y: py, intensity: 0.92 });
        }
        continue;
      }

      const dist = Math.hypot(px, py);
      if (dist >= innerR && dist <= outerR) {
        targets.push({ x: px, y: py, intensity: 1.0 });
        continue;
      }

      if (dist < innerR) {
        const isTick =
          (px === 0 && Math.abs(py) >= 6 && Math.abs(py) <= 7) ||
          (py === 0 && Math.abs(px) >= 6 && Math.abs(px) <= 7);
        const isCenter = Math.abs(px) <= 1 && Math.abs(py) <= 1;
        const isMinuteHand = px === 0 && py >= -6 && py <= 0;
        const isHourHand = py === 0 && px >= 0 && px <= 5;

        if (isCenter || isMinuteHand || isHourHand) {
          targets.push({ x: px, y: py, intensity: 1.0 });
        } else if (isTick) {
          targets.push({ x: px, y: py, intensity: 0.62 });
        }
      }
    }
  }
  return targets;
}

function generatePawTargets(): ShapeTarget[] {
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
  cylinder: generateCylinderTargets(),
  fire: generateFireTargets(),
  triangle: generateTriangleTargets(),
  letter: generateLetterTargets(),
  star: generateStarTargets(),
  skull: generateSkullTargets(),
  sword: generateSwordTargets(),
  clock: generateClockTargets(),
  paw: generatePawTargets(),
};

const REGULAR_SHAPES: ShapeId[] = [
  'cube',
  'sphere',
  'cylinder',
  'fire',
  'triangle',
  'letter',
  'star',
  'skull',
  'sword',
  'clock',
  'question',
];

interface ParticleQuestionMarkProps {
  isHovered?: boolean;
}

export function ParticleQuestionMark({ isHovered = false }: ParticleQuestionMarkProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isHoveredPropRef = useRef(isHovered);
  isHoveredPropRef.current = isHovered;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 80;
    let height = 56;
    let frameData = ctx.createImageData(width, height);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const pixelSize = rect.height >= 295 ? 6 : 4;
      const nextW = Math.max(52, Math.round(rect.width / pixelSize));
      const nextH = Math.max(40, Math.round(rect.height / pixelSize));
      if (nextW === width && nextH === height && canvas.width === nextW) return;
      width = nextW;
      height = nextH;
      canvas.width = width;
      canvas.height = height;
      frameData = ctx.createImageData(width, height);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // Central rotating spiral vortex of particles that periodically assembles into shapes
    const MAX_PARTICLES = 440;
    const ARM_COUNT = 3;
    const particles: SwarmParticle[] = Array.from({ length: MAX_PARTICLES }, (_, idx) => {
      const u = Math.random();
      const orbitR = 2.4 + Math.pow(u, 1.32) * 23.0;
      const isArmMember = idx % 3 !== 0;
      const armIndex = idx % ARM_COUNT;
      const armSpread = (Math.random() - 0.5) * (0.65 + orbitR * 0.032);
      const baseAngle = isArmMember
        ? (armIndex * Math.PI * 2) / ARM_COUNT + orbitR * 0.23 + armSpread
        : Math.random() * Math.PI * 2;
      const orbitSpeed = isArmMember
        ? 0.34
        : 0.24 + (0.48 / (0.65 + orbitR * 0.12)) * (0.8 + Math.random() * 0.35);
      const startX = Math.cos(baseAngle) * orbitR;
      const startY = Math.sin(baseAngle) * orbitR * 0.88;

      return {
        x: startX,
        y: startY,
        orbitR,
        baseAngle,
        orbitSpeed,
        isArmMember,
        orbitEcc: 0.84 + Math.random() * 0.14,
        radialAmp: 0.45 + Math.random() * 1.1,
        radialFreq: 0.45 + Math.random() * 0.7,
        tx: 0,
        ty: 0,
        tIntensity: 0.9,
        driftPhase: Math.random() * Math.PI * 2,
        stagger: Math.random() * 0.58,
        active: false,
      };
    });

    let currentShape: ShapeId = 'question';
    let lastRegularShape: ShapeId = 'question';

    const assignShapeTargets = (shape: ShapeId) => {
      currentShape = shape;
      const rawTargets = SHAPE_LIBRARY[shape];
      const shuffled = [...rawTargets];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = tmp;
      }

      // Keep ~92% of shape points for clear silhouettes with subtle cosmic gaps
      const activeLimit = Math.max(24, Math.round(shuffled.length * 0.92));

      // Shuffle particle assignment so particles from across the rotating vortex gather into the pattern
      const indices = Array.from({ length: particles.length }, (_, idx) => idx);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = indices[i];
        indices[i] = indices[j];
        indices[j] = tmp;
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[indices[i]];
        if (i < activeLimit) {
          p.tx = shuffled[i].x;
          p.ty = shuffled[i].y;
          p.tIntensity = shuffled[i].intensity;
          p.active = true;
        } else {
          p.active = false;
        }
      }
    };

    const pickNextShape = (): ShapeId => {
      if (Math.random() < 0.02) {
        return 'paw';
      }
      const candidates = REGULAR_SHAPES.filter((s) => s !== lastRegularShape);
      const next = candidates[Math.floor(Math.random() * candidates.length)];
      lastRegularShape = next;
      return next;
    };

    assignShapeTargets('question');

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let isVisible = true;
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    let pointer = { x: 0, y: 0, active: false };
    let localPointerHover = false;
    const handlePointerEnter = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') {
        localPointerHover = true;
      }
    };
    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      if (e.pointerType !== 'touch') {
        localPointerHover = true;
      }
      pointer = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * width,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * height,
        active: true,
      };
    };
    const handlePointerLeave = () => {
      pointer.active = false;
      localPointerHover = false;
    };

    container.addEventListener('pointerenter', handlePointerEnter, { passive: true });
    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave);

    const FORM_DUR = 1.65;
    const DISSOLVE_DUR = 1.85;

    let simTime = 0;
    let rawFormation = prefersReducedMotion ? 1 : 0;
    let wasHoverActive = false;
    let hasShownInitial = false;

    const renderFrame = (dt: number) => {
      const data = frameData.data;
      data.fill(0);

      const cx = Math.floor(width * 0.5);
      const cy = Math.floor(height * 0.5);

      const formation = rawFormation * rawFormation * (3 - 2 * rawFormation);

      const isPaw = currentShape === 'paw';
      const isFire = currentShape === 'fire';
      const isStar = currentShape === 'star';

      const patternRot = isStar
        ? simTime * 0.28
        : Math.sin(simTime * 1.15) * 0.22 * formation;
      const rotCos = Math.cos(patternRot);
      const rotSin = Math.sin(patternRot);
      const swayX = Math.sin(simTime * 0.9) * 1.65 * formation;
      const swayY = Math.cos(simTime * 1.35) * 1.25 * formation;

      const swirlScale = Math.max(0.88, Math.min(1.15, height / 62));
      const glideFree = 1 - Math.exp(-3.1 * dt);
      const glideSnap = 1 - Math.exp(-5.0 * dt);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (prefersReducedMotion) {
          if (!p.active) continue;
          const px = Math.round(cx + p.tx);
          const py = Math.round(cy + p.ty);
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = (py * width + px) << 2;
            data[idx] = 255;
            data[idx + 1] = 252;
            data[idx + 2] = 255;
            data[idx + 3] = Math.round(p.tIntensity * 255);
          }
          continue;
        }

        // Slow, smooth rotating central spiral galaxy orbit
        const armRipple = p.isArmMember
          ? Math.sin(simTime * 0.42 + p.driftPhase) * 0.2
          : 0;
        const angle = p.baseAngle + simTime * p.orbitSpeed + armRipple;

        const r =
          (p.orbitR +
            Math.sin(simTime * p.radialFreq + p.driftPhase) * p.radialAmp) *
          swirlScale;

        const wx = Math.cos(angle) * r;
        const wy = Math.sin(angle) * r * p.orbitEcc;

        let targetX = wx;
        let targetY = wy;

        const coreGlow = Math.max(0, 1 - p.orbitR / 26);
        let alpha =
          (0.26 + coreGlow * 0.42) *
          (0.76 + 0.24 * Math.sin(simTime * 1.15 + p.driftPhase));

        if (p.active) {
          const localProgress = Math.max(
            0,
            Math.min(1, formation * (1 + p.stagger) - p.stagger * 0.45)
          );
          const ease = localProgress * localProgress * (3 - 2 * localProgress);

          let fx = p.tx;
          let fy = p.ty;

          if (isFire && ease > 0.45) {
            const heightRatio = Math.max(0, 0.55 - p.ty / 18);
            fx +=
              Math.sin(simTime * 3.6 + p.ty * 0.55 + p.driftPhase) *
              0.6 *
              heightRatio *
              ease;
          }

          // Gentle breathing softness so edges stay slightly elusive
          fx += Math.sin(simTime * 1.65 + p.driftPhase) * 0.24;
          fy += Math.cos(simTime * 1.45 + p.driftPhase * 1.2) * 0.24;

          const rfx = fx * rotCos - fy * rotSin + swayX;
          const rfy = fx * rotSin + fy * rotCos + swayY;

          // Polar spiral coalescence directly out of the rotating orbit
          const rOrbit = Math.hypot(wx, wy);
          const angleOrbit = Math.atan2(wy, wx);
          const rTarget = Math.hypot(rfx, rfy);

          if (rTarget < 0.05) {
            targetX = wx * (1 - ease);
            targetY = wy * (1 - ease);
          } else {
            const angleTarget = Math.atan2(rfy, rfx);
            let angleDiff = angleTarget - angleOrbit;
            angleDiff =
              ((((angleDiff + Math.PI) % (Math.PI * 2)) + Math.PI * 2) %
                (Math.PI * 2)) -
              Math.PI;
            const spiralLead = Math.sin(ease * Math.PI) * 0.72;
            const curR = rOrbit + (rTarget - rOrbit) * ease;
            const curTheta = angleOrbit + angleDiff * ease + spiralLead;
            targetX = Math.cos(curTheta) * curR;
            targetY = Math.sin(curTheta) * curR;
          }

          const shimmer = 0.82 + 0.16 * Math.sin(simTime * 1.9 + p.driftPhase);
          alpha = alpha + (p.tIntensity * 0.98 * shimmer - alpha) * ease;
        } else if (formation > 0.1) {
          // Leave subtle stray dust drifting around and lightly across the pattern
          const distFromCenter = Math.hypot(wx, wy);
          if (distFromCenter < 15.5) {
            alpha *= Math.max(0.08, 1 - formation * 0.78);
          } else {
            alpha *= 1 - formation * 0.28;
          }
        }

        if (pointer.active && formation < 0.92) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > 0.01 && distSq < 120) {
            const dist = Math.sqrt(distSq);
            const repulseScale = 1 - formation * 0.85;
            const strength = ((11 - dist) / 11) * repulseScale;
            const push = strength * 4.2;
            const swirlTang = strength * 2.2;
            targetX += (dx / dist) * push - (dy / dist) * swirlTang;
            targetY += (dy / dist) * push + (dx / dist) * swirlTang;
          }
        }

        const follow = p.active && formation > 0.35 ? glideSnap : glideFree;
        p.x += (targetX - p.x) * follow;
        p.y += (targetY - p.y) * follow;

        const px = Math.round(cx + p.x);
        const py = Math.round(cy + p.y);
        if (px < 0 || px >= width || py < 0 || py >= height) continue;

        const idx = (py * width + px) << 2;
        const aByte = Math.min(255, Math.round(alpha * 255));
        if (aByte <= data[idx + 3]) continue;

        if (isPaw && p.active && formation > 0.5 && p.tIntensity >= 0.9) {
          data[idx] = 255;
          data[idx + 1] = 224;
          data[idx + 2] = 240;
        } else {
          data[idx] = 255;
          data[idx + 1] = p.active ? 252 : 244;
          data[idx + 2] = 255;
        }
        data[idx + 3] = aByte;
      }

      ctx.putImageData(frameData, 0, 0);
    };

    renderFrame(1 / 50);

    if (prefersReducedMotion) {
      return () => {
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
        container.removeEventListener('pointerenter', handlePointerEnter);
        container.removeEventListener('pointermove', handlePointerMove);
        container.removeEventListener('pointerleave', handlePointerLeave);
      };
    }

    let rafId = 0;
    let lastNow = 0;
    const FRAME_MS = 1000 / 50;

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      if (!isVisible) return;
      if (now - lastNow < FRAME_MS) return;

      const dt = lastNow ? Math.min(0.06, (now - lastNow) / 1000) : 1 / 50;
      lastNow = now;

      simTime += dt;

      const hoverActive = isHoveredPropRef.current || localPointerHover;
      if (hoverActive && !wasHoverActive) {
        if (rawFormation <= 0.12) {
          if (!hasShownInitial) {
            hasShownInitial = true;
            assignShapeTargets('question');
          } else {
            assignShapeTargets(pickNextShape());
          }
        }
      }
      wasHoverActive = hoverActive;

      if (hoverActive) {
        rawFormation = Math.min(1, rawFormation + dt / FORM_DUR);
      } else {
        rawFormation = Math.max(0, rawFormation - dt / DISSOLVE_DUR);
      }

      renderFrame(dt);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      container.removeEventListener('pointerenter', handlePointerEnter);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
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
