export interface NebulaUiTheme {
  '--ui-bg': string;
  '--ui-header': string;
  '--ui-deep': string;
  '--ui-checker-a': string;
  '--ui-checker-b': string;
  '--ui-surface-alt': string;
  '--ui-card': string;
  '--ui-card-hover': string;
  '--ui-price-bg': string;
  '--ui-border': string;
  '--ui-border-strong': string;
  '--ui-accent': string;
  '--ui-accent-soft': string;
  '--ui-accent-bright': string;
  '--ui-btn-bg': string;
  '--ui-btn-hover': string;
  '--ui-btn-text': string;
  '--ui-text': string;
  '--ui-text-bright': string;
  '--ui-text-muted': string;
  '--ui-glow-rgb': string;
}

// Indexed 0..7 matching RAMPS in DitherNebula.tsx (deep nocturnal tones):
// 0: Purple (standard default), 1: Indigo/Blue, 2: Teal, 3: Emerald,
// 4: Crimson, 5: Amber, 6: Plum, 7: Coral
export const NEBULA_UI_THEMES: readonly NebulaUiTheme[] = [
  // 0: Standard Deep Purple (Default & Background OFF)
  {
    '--ui-bg': '#07020e',
    '--ui-header': '#0d0418',
    '--ui-deep': '#10051c',
    '--ui-checker-a': '#120620',
    '--ui-checker-b': '#190a2b',
    '--ui-surface-alt': '#140724',
    '--ui-card': '#190a29',
    '--ui-card-hover': '#210e36',
    '--ui-price-bg': '#220e38',
    '--ui-border': '#2c1347',
    '--ui-border-strong': '#431d6b',
    '--ui-accent': '#a674de',
    '--ui-accent-soft': '#c29ced',
    '--ui-accent-bright': '#d8bff5',
    '--ui-btn-bg': '#5b2a8c',
    '--ui-btn-hover': '#6f35ab',
    '--ui-btn-text': '#fbf7ff',
    '--ui-text': '#dfcaf2',
    '--ui-text-bright': '#eee2fa',
    '--ui-text-muted': '#a88ec4',
    '--ui-glow-rgb': '166, 116, 222',
  },
  // 1: Deep Indigo / Blue
  {
    '--ui-bg': '#040612',
    '--ui-header': '#080c21',
    '--ui-deep': '#0a0f26',
    '--ui-checker-a': '#0c112b',
    '--ui-checker-b': '#11183b',
    '--ui-surface-alt': '#0d1330',
    '--ui-card': '#10183b',
    '--ui-card-hover': '#16214f',
    '--ui-price-bg': '#162152',
    '--ui-border': '#1e2c66',
    '--ui-border-strong': '#2f4396',
    '--ui-accent': '#6b7ce0',
    '--ui-accent-soft': '#93a2eb',
    '--ui-accent-bright': '#bcc7f7',
    '--ui-btn-bg': '#324294',
    '--ui-btn-hover': '#3f52b3',
    '--ui-btn-text': '#f4f6ff',
    '--ui-text': '#ced6f7',
    '--ui-text-bright': '#e3e8fc',
    '--ui-text-muted': '#8b98cf',
    '--ui-glow-rgb': '107, 124, 224',
  },
  // 2: Deep Teal / Cyan-Blue
  {
    '--ui-bg': '#030b10',
    '--ui-header': '#06131c',
    '--ui-deep': '#071722',
    '--ui-checker-a': '#091b29',
    '--ui-checker-b': '#0d2538',
    '--ui-surface-alt': '#091e2b',
    '--ui-card': '#0c2433',
    '--ui-card-hover': '#113045',
    '--ui-price-bg': '#103147',
    '--ui-border': '#16405c',
    '--ui-border-strong': '#215c82',
    '--ui-accent': '#3ca4c7',
    '--ui-accent-soft': '#6fc0db',
    '--ui-accent-bright': '#a8dced',
    '--ui-btn-bg': '#195c78',
    '--ui-btn-hover': '#217394',
    '--ui-btn-text': '#f0faff',
    '--ui-text': '#cae5f2',
    '--ui-text-bright': '#e3f3fa',
    '--ui-text-muted': '#7eaec7',
    '--ui-glow-rgb': '60, 164, 199',
  },
  // 3: Deep Emerald
  {
    '--ui-bg': '#030d0b',
    '--ui-header': '#061614',
    '--ui-deep': '#071b18',
    '--ui-checker-a': '#08201c',
    '--ui-checker-b': '#0c2c26',
    '--ui-surface-alt': '#09221d',
    '--ui-card': '#0c2923',
    '--ui-card-hover': '#113830',
    '--ui-price-bg': '#113830',
    '--ui-border': '#16473e',
    '--ui-border-strong': '#21695b',
    '--ui-accent': '#39ad86',
    '--ui-accent-soft': '#6ac7a7',
    '--ui-accent-bright': '#a6e3ce',
    '--ui-btn-bg': '#18614a',
    '--ui-btn-hover': '#1f7a5d',
    '--ui-btn-text': '#f0fdf8',
    '--ui-text': '#c7ebde',
    '--ui-text-bright': '#e1f7ef',
    '--ui-text-muted': '#7eb8a3',
    '--ui-glow-rgb': '57, 173, 134',
  },
  // 4: Deep Crimson
  {
    '--ui-bg': '#10030a',
    '--ui-header': '#1a0510',
    '--ui-deep': '#1f0613',
    '--ui-checker-a': '#240817',
    '--ui-checker-b': '#300b1f',
    '--ui-surface-alt': '#260818',
    '--ui-card': '#2b0a1c',
    '--ui-card-hover': '#3b0e26',
    '--ui-price-bg': '#3b0e27',
    '--ui-border': '#4f1434',
    '--ui-border-strong': '#73204d',
    '--ui-accent': '#cc5c90',
    '--ui-accent-soft': '#e08ab2',
    '--ui-accent-bright': '#f0bad3',
    '--ui-btn-bg': '#751f49',
    '--ui-btn-hover': '#8f2759',
    '--ui-btn-text': '#fff2f8',
    '--ui-text': '#f0d1e1',
    '--ui-text-bright': '#fae6f0',
    '--ui-text-muted': '#bd88a4',
    '--ui-glow-rgb': '204, 92, 144',
  },
  // 5: Deep Amber
  {
    '--ui-bg': '#0f0804',
    '--ui-header': '#170d07',
    '--ui-deep': '#1c1009',
    '--ui-checker-a': '#21130b',
    '--ui-checker-b': '#2e1a0f',
    '--ui-surface-alt': '#24140b',
    '--ui-card': '#29170d',
    '--ui-card-hover': '#382012',
    '--ui-price-bg': '#382012',
    '--ui-border': '#4d2c19',
    '--ui-border-strong': '#704124',
    '--ui-accent': '#cf8e42',
    '--ui-accent-soft': '#e0ad6e',
    '--ui-accent-bright': '#f0cfa3',
    '--ui-btn-bg': '#754618',
    '--ui-btn-hover': '#8f561f',
    '--ui-btn-text': '#fff8f0',
    '--ui-text': '#eddcc7',
    '--ui-text-bright': '#f7ece0',
    '--ui-text-muted': '#b89a78',
    '--ui-glow-rgb': '207, 142, 66',
  },
  // 6: Deep Plum
  {
    '--ui-bg': '#0d0312',
    '--ui-header': '#14051c',
    '--ui-deep': '#180621',
    '--ui-checker-a': '#1c0826',
    '--ui-checker-b': '#280c36',
    '--ui-surface-alt': '#1f082b',
    '--ui-card': '#240a33',
    '--ui-card-hover': '#310f45',
    '--ui-price-bg': '#330f47',
    '--ui-border': '#45165e',
    '--ui-border-strong': '#66238a',
    '--ui-accent': '#bf6ad9',
    '--ui-accent-soft': '#d494e8',
    '--ui-accent-bright': '#e8c2f5',
    '--ui-btn-bg': '#682282',
    '--ui-btn-hover': '#7e2b9e',
    '--ui-btn-text': '#fdf5ff',
    '--ui-text': '#ebd0f2',
    '--ui-text-bright': '#f6e6fa',
    '--ui-text-muted': '#b88ec4',
    '--ui-glow-rgb': '191, 106, 217',
  },
  // 7: Deep Coral
  {
    '--ui-bg': '#120508',
    '--ui-header': '#1a080c',
    '--ui-deep': '#1f0a0f',
    '--ui-checker-a': '#240c12',
    '--ui-checker-b': '#301018',
    '--ui-surface-alt': '#260c13',
    '--ui-card': '#2b0e16',
    '--ui-card-hover': '#3b141f',
    '--ui-price-bg': '#3b1420',
    '--ui-border': '#4f1c2b',
    '--ui-border-strong': '#732b40',
    '--ui-accent': '#d16274',
    '--ui-accent-soft': '#e38f9d',
    '--ui-accent-bright': '#f2bfc8',
    '--ui-btn-bg': '#782433',
    '--ui-btn-hover': '#912d3f',
    '--ui-btn-text': '#fff2f4',
    '--ui-text': '#f2d3d8',
    '--ui-text-bright': '#fae8eb',
    '--ui-text-muted': '#bf8a93',
    '--ui-glow-rgb': '209, 98, 116',
  },
];

type RgbTuple = [number, number, number];
type ThemeKey = keyof NebulaUiTheme;
type ParsedTheme = Record<ThemeKey, RgbTuple>;

const THEME_KEYS = Object.keys(NEBULA_UI_THEMES[0]) as ThemeKey[];

function parseColorValue(value: string): RgbTuple {
  const trimmed = value.trim();
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return [r, g, b];
  }
  const parts = trimmed.split(',').map((part) => Number(part.trim()));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function parseTheme(theme: NebulaUiTheme): ParsedTheme {
  const parsed = {} as ParsedTheme;
  for (const key of THEME_KEYS) {
    parsed[key] = parseColorValue(theme[key]);
  }
  return parsed;
}

function toHexByte(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, '0');
}

function formatThemeValue(key: ThemeKey, rgb: RgbTuple): string {
  if (key === '--ui-glow-rgb') {
    return `${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])}`;
  }
  return `#${toHexByte(rgb[0])}${toHexByte(rgb[1])}${toHexByte(rgb[2])}`;
}

const PARSED_THEMES: readonly ParsedTheme[] = NEBULA_UI_THEMES.map(parseTheme);
const currentRgb: ParsedTheme = parseTheme(NEBULA_UI_THEMES[0]);
let targetThemeIndex = 0;
let rafId = 0;
let lastFrameTime = 0;

function writeThemeToRoot(theme: NebulaUiTheme) {
  const rootStyle = document.documentElement.style;
  for (const key of THEME_KEYS) {
    rootStyle.setProperty(key, theme[key]);
  }
}

function stepThemeTransition(now: number) {
  if (typeof document === 'undefined') {
    rafId = 0;
    return;
  }

  const dtSec = lastFrameTime ? Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000)) : 1 / 60;
  lastFrameTime = now;

  // Smooth exponential damping (~3s organic transition)
  const blend = 1 - Math.exp(-dtSec * 1.1);
  const targetParsed = PARSED_THEMES[targetThemeIndex] ?? PARSED_THEMES[0];
  const rootStyle = document.documentElement.style;

  let maxDelta = 0;

  for (const key of THEME_KEYS) {
    const cur = currentRgb[key];
    const tgt = targetParsed[key];

    const dr = tgt[0] - cur[0];
    const dg = tgt[1] - cur[1];
    const db = tgt[2] - cur[2];

    const absMax = Math.max(Math.abs(dr), Math.abs(dg), Math.abs(db));
    if (absMax > maxDelta) {
      maxDelta = absMax;
    }

    cur[0] += dr * blend;
    cur[1] += dg * blend;
    cur[2] += db * blend;

    rootStyle.setProperty(key, formatThemeValue(key, cur));
  }

  if (maxDelta < 0.4) {
    const exactTheme = NEBULA_UI_THEMES[targetThemeIndex] ?? NEBULA_UI_THEMES[0];
    const exactParsed = PARSED_THEMES[targetThemeIndex] ?? PARSED_THEMES[0];
    for (const key of THEME_KEYS) {
      currentRgb[key][0] = exactParsed[key][0];
      currentRgb[key][1] = exactParsed[key][1];
      currentRgb[key][2] = exactParsed[key][2];
    }
    writeThemeToRoot(exactTheme);
    rafId = 0;
    lastFrameTime = 0;
    return;
  }

  rafId = requestAnimationFrame(stepThemeTransition);
}

export function applyNebulaUiTheme(themeIndex: number) {
  if (typeof document === 'undefined') return;
  const safeIdx = NEBULA_UI_THEMES[themeIndex] ? themeIndex : 0;
  targetThemeIndex = safeIdx;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
      lastFrameTime = 0;
    }
    const exactTheme = NEBULA_UI_THEMES[safeIdx];
    const exactParsed = PARSED_THEMES[safeIdx];
    for (const key of THEME_KEYS) {
      currentRgb[key][0] = exactParsed[key][0];
      currentRgb[key][1] = exactParsed[key][1];
      currentRgb[key][2] = exactParsed[key][2];
    }
    writeThemeToRoot(exactTheme);
    return;
  }

  if (!rafId) {
    lastFrameTime = 0;
    rafId = requestAnimationFrame(stepThemeTransition);
  }
}
