import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import {
  Currency,
  DEFAULT_USD_RATE,
  Language,
  PortfolioCategory,
  PortfolioSprite,
  formatCategoryMinAmount,
} from '../data/portfolioData';

interface SpriteLightboxModalProps {
  isOpen: boolean;
  category: PortfolioCategory | null;
  spriteIndex: number;
  lang: Language;
  currency: Currency;
  usdRate?: number;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
}

type BackdropMode = 'checker-dark' | 'dark' | 'checker-light';

const getInitialZoom = () =>
  typeof window !== 'undefined' && window.innerWidth < 640 ? 1.15 : 2;

export function SpriteLightboxModal({
  isOpen,
  category,
  spriteIndex,
  lang,
  currency,
  usdRate = DEFAULT_USD_RATE,
  onClose,
}: SpriteLightboxModalProps) {
  const [zoom, setZoom] = useState<number>(getInitialZoom);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [backdrop, setBackdrop] = useState<BackdropMode>('checker-dark');
  const [downloading, setDownloading] = useState(false);

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pinchRef = useRef<{
    initialDist: number;
    initialZoom: number;
    initialMidX: number;
    initialMidY: number;
    initialPanX: number;
    initialPanY: number;
  } | null>(null);

  const sprites = category?.sprites ?? [];
  const activeSprite: PortfolioSprite | undefined = sprites[spriteIndex] ?? sprites[0];

  useEffect(() => {
    setZoom(getInitialZoom());
    setPan({ x: 0, y: 0 });
    pointersRef.current.clear();
    dragStartRef.current = null;
    pinchRef.current = null;
    setIsDragging(false);
  }, [spriteIndex, category?.id, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoom((z) => Math.min(12, Number((z + 0.5).toFixed(2))));
      } else if (e.key === '-') {
        setZoom((z) => Math.max(0.5, Number((z - 0.5).toFixed(2))));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.35 : -0.35;
    setZoom((prev) => Math.max(0.5, Math.min(12, Number((prev + delta).toFixed(2)))));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1) {
      pinchRef.current = null;
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    } else if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values()) as Array<{ x: number; y: number }>;
      const dist = Math.max(1, Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y));
      const midX = (pts[0].x + pts[1].x) * 0.5;
      const midY = (pts[0].y + pts[1].y) * 0.5;
      dragStartRef.current = null;
      setIsDragging(true);
      pinchRef.current = {
        initialDist: dist,
        initialZoom: zoom,
        initialMidX: midX,
        initialMidY: midY,
        initialPanX: pan.x,
        initialPanY: pan.y,
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const pts = Array.from(pointersRef.current.values()) as Array<{ x: number; y: number }>;
      const dist = Math.max(1, Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y));
      const midX = (pts[0].x + pts[1].x) * 0.5;
      const midY = (pts[0].y + pts[1].y) * 0.5;

      const scale = dist / pinchRef.current.initialDist;
      const nextZoom = Math.max(
        0.5,
        Math.min(12, Number((pinchRef.current.initialZoom * scale).toFixed(2)))
      );
      setZoom(nextZoom);
      setPan({
        x: pinchRef.current.initialPanX + (midX - pinchRef.current.initialMidX),
        y: pinchRef.current.initialPanY + (midY - pinchRef.current.initialMidY),
      });
    } else if (pointersRef.current.size === 1 && dragStartRef.current) {
      setPan({
        x: dragStartRef.current.panX + (e.clientX - dragStartRef.current.x),
        y: dragStartRef.current.panY + (e.clientY - dragStartRef.current.y),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);

    if (pointersRef.current.size === 1) {
      const [remaining] = Array.from(pointersRef.current.values()) as Array<{
        x: number;
        y: number;
      }>;
      pinchRef.current = null;
      dragStartRef.current = {
        x: remaining.x,
        y: remaining.y,
        panX: pan.x,
        panY: pan.y,
      };
      setIsDragging(true);
    } else if (pointersRef.current.size === 0) {
      pinchRef.current = null;
      dragStartRef.current = null;
      setIsDragging(false);
    }
  };

  const handleDownload = async () => {
    if (!activeSprite || downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(activeSprite.src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = activeSprite.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      const link = document.createElement('a');
      link.href = activeSprite.src;
      link.download = activeSprite.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloading(false);
    }
  };

  const backdropClass =
    backdrop === 'checker-dark'
      ? 'pixel-checkerboard'
      : backdrop === 'checker-light'
      ? 'pixel-checkerboard-light'
      : 'bg-[var(--ui-bg)]';

  return (
    <AnimatePresence>
      {isOpen && category && activeSprite && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-1.5 sm:p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'ru' ? activeSprite.titleRu : activeSprite.titleEn}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-[98vw] sm:w-[96vw] max-w-[96vw] h-[94dvh] max-h-[94dvh] bg-[var(--ui-deep)] border-2 border-[var(--ui-border-strong)] rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.85)] flex flex-col transition-colors duration-500"
          >
            {/* Minimal Top Controls */}
            <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-[var(--ui-border)] bg-[var(--ui-header)] flex flex-wrap items-center justify-between gap-2 sm:gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {/* Zoom In / Out */}
                <div className="flex items-center bg-[var(--ui-surface-alt)] border border-[var(--ui-border)] rounded-xl p-1 gap-0.5 sm:gap-1">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.5).toFixed(2))))}
                    aria-label={lang === 'ru' ? 'Уменьшить' : 'Zoom out'}
                    className="p-1.5 sm:p-2 rounded-lg text-[var(--ui-text)] hover:bg-[var(--ui-card-hover)] hover:text-white transition-colors cursor-pointer"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-1.5 sm:px-2 font-mono text-xs sm:text-sm text-[var(--ui-text-bright)] tabular-nums min-w-[46px] sm:min-w-[54px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(12, Number((z + 0.5).toFixed(2))))}
                    aria-label={lang === 'ru' ? 'Увеличить' : 'Zoom in'}
                    className="p-1.5 sm:p-2 rounded-lg text-[var(--ui-text)] hover:bg-[var(--ui-card-hover)] hover:text-white transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                {/* Background Switcher */}
                <div className="flex items-center bg-[var(--ui-surface-alt)] border border-[var(--ui-border)] rounded-xl p-1 gap-0.5 sm:gap-1">
                  <button
                    type="button"
                    onClick={() => setBackdrop('checker-dark')}
                    className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      backdrop === 'checker-dark'
                        ? 'bg-[var(--ui-border-strong)] text-white'
                        : 'text-[var(--ui-text)]/75 hover:text-white'
                    }`}
                  >
                    {lang === 'ru' ? 'Сетка' : 'Grid'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackdrop('dark')}
                    className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      backdrop === 'dark'
                        ? 'bg-[var(--ui-border-strong)] text-white'
                        : 'text-[var(--ui-text)]/75 hover:text-white'
                    }`}
                  >
                    {lang === 'ru' ? 'Тёмный' : 'Dark'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackdrop('checker-light')}
                    className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      backdrop === 'checker-light'
                        ? 'bg-[var(--ui-border-strong)] text-white'
                        : 'text-[var(--ui-text)]/75 hover:text-white'
                    }`}
                  >
                    {lang === 'ru' ? 'Светлый' : 'Light'}
                  </button>
                </div>
              </div>

              {/* Category & Price Badge */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--ui-surface-alt)] border border-[var(--ui-border)] text-xs font-mono">
                <span className="text-[var(--ui-text-muted)]">
                  {lang === 'ru' ? category.nameRu : category.nameEn}:
                </span>
                <span className="text-[#f4d35e] font-bold">
                  {formatCategoryMinAmount(category.priceSummaryRub, currency, lang, usdRate)}
                </span>
              </div>

              {/* Download & Close */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-[var(--ui-accent)]/35 bg-[var(--ui-btn-bg)] hover:bg-[var(--ui-btn-hover)] text-[var(--ui-btn-text)] font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'ru' ? 'Скачать' : 'Download'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={lang === 'ru' ? 'Закрыть' : 'Close'}
                  className="p-1.5 sm:p-2 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-alt)] text-[var(--ui-text)] hover:text-white hover:border-[var(--ui-accent)] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Large Touch-Friendly Pan & Pinch-Zoom Viewport */}
            <div
              className={`relative flex-1 overflow-hidden select-none touch-none flex items-center justify-center ${backdropClass} ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div
                style={{
                  transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="flex items-center justify-center p-4 sm:p-8 pointer-events-none"
              >
                <img
                  src={activeSprite.src}
                  alt={lang === 'ru' ? activeSprite.titleRu : activeSprite.titleEn}
                  referrerPolicy="no-referrer"
                  draggable={false}
                  className="max-w-[260px] max-h-[260px] sm:max-w-[440px] sm:max-h-[440px] object-contain pixelated"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
