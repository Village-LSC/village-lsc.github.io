import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Currency,
  Language,
  PortfolioCategory,
  PortfolioSprite,
  formatCategoryMinAmount,
} from '../data/portfolioData';
import { ParticleQuestionMark } from './ParticleQuestionMark';

interface CategoryCardProps {
  category: PortfolioCategory;
  side: 'left' | 'right';
  lang: Language;
  currency: Currency;
  onOpenSprite: (category: PortfolioCategory, spriteIndex: number) => void;
}

export function CategoryCard({
  category,
  side,
  lang,
  currency,
  onOpenSprite,
}: CategoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFrameHovered, setIsFrameHovered] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const closeTimerRef = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const mobileReelRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const wheelPauseUntilRef = useRef<number>(0);

  const hasSprites = category.sprites.length > 0;
  const coverSprite = hasSprites ? category.sprites[0] : undefined;
  const secondarySprites = useMemo(() => {
    if (!coverSprite) return [];
    const rest = category.sprites.slice(1);
    const ordered = rest.length > 0 ? [...rest, coverSprite] : [coverSprite];
    const filled: Array<{ sprite: PortfolioSprite; originalIndex: number }> = [];
    while (filled.length < 6) {
      ordered.forEach((sp) => {
        const origIdx = category.sprites.findIndex((item) => item.id === sp.id);
        filled.push({ sprite: sp, originalIndex: origIdx >= 0 ? origIdx : 0 });
      });
    }
    return filled;
  }, [category.sprites, coverSprite]);

  const loopedReel = useMemo(
    () => [...secondarySprites, ...secondarySprites],
    [secondarySprites]
  );

  // Smooth sub-pixel transform loop + inertial mouse-wheel glide (desktop hover)
  useEffect(() => {
    if (!isHovered || !hasSprites) {
      offsetRef.current = 0;
      velocityRef.current = 0;
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;

    const tick = () => {
      const track = trackRef.current;
      if (track) {
        const halfWidth = track.scrollWidth / 2;
        if (halfWidth > 0) {
          const autoDrift =
            !prefersReducedMotion &&
            !isFrameHovered &&
            performance.now() > wheelPauseUntilRef.current
              ? 0.65
              : 0;

          velocityRef.current *= 0.9;
          if (Math.abs(velocityRef.current) < 0.02) {
            velocityRef.current = 0;
          }

          let next = offsetRef.current + autoDrift + velocityRef.current;
          while (next < 0) next += halfWidth;
          while (next >= halfWidth) next -= halfWidth;
          offsetRef.current = next;

          track.style.transform = `translate3d(${-next}px, 0, 0)`;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isHovered, isFrameHovered, hasSprites]);

  // Non-passive wheel listener for smooth momentum horizontal scrubbing
  useEffect(() => {
    if (!isHovered || !hasSprites) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rawDelta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const impulse = Math.max(-18, Math.min(18, rawDelta * 0.16));
      velocityRef.current = Math.max(-28, Math.min(28, velocityRef.current + impulse));
      wheelPauseUntilRef.current = performance.now() + 1000;
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      viewport.removeEventListener('wheel', handleWheel);
    };
  }, [isHovered, hasSprites]);

  const handleMouseEnter = () => {
    if (!hasSprites) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      !window.matchMedia('(min-width: 1024px) and (hover: hover)').matches
    ) {
      return;
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = window.setTimeout(() => {
      setIsHovered(false);
      setIsFrameHovered(false);
    }, 110);
  };

  const scrollMobileReel = (direction: -1 | 1) => {
    const reel = mobileReelRef.current;
    if (!reel) return;
    const step = Math.max(160, Math.round(reel.clientWidth * 0.72));
    reel.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  const markImageFailed = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  const name = lang === 'ru' ? category.nameRu : category.nameEn;
  const description = lang === 'ru' ? category.descriptionRu : category.descriptionEn;
  const note = lang === 'ru' ? category.noteRu : category.noteEn;

  return (
    <article
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative ${isHovered ? 'z-40' : 'z-10'}`}
    >
      <div
        data-nebula-light="true"
        style={
          isHovered
            ? { boxShadow: '0 0 28px rgba(var(--ui-glow-rgb), 0.2)' }
            : undefined
        }
        className={`relative rounded-2xl border-2 bg-[var(--ui-card)]/95 overflow-visible transition-all duration-500 shadow-[0_14px_40px_rgba(0,0,0,0.6)] ${
          isHovered
            ? 'border-[var(--ui-accent)]'
            : 'border-[var(--ui-border)] hover:border-[var(--ui-accent)]'
        }`}
      >
        {/* Artwork Window + Smoothly Emerging Desktop Filmstrip */}
        <div className="relative">
          {category.customAvatar === 'particle-question' || !coverSprite ? (
            <div
              className="relative w-full h-[220px] sm:h-[290px] lg:h-[370px] rounded-t-[14px] overflow-hidden border-b-2 border-[var(--ui-bg)] pixel-checkerboard flex items-center justify-center"
              aria-label={name}
            >
              <ParticleQuestionMark />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenSprite(category, 0)}
              className="group/thumb relative w-full h-[220px] sm:h-[290px] lg:h-[370px] rounded-t-[14px] overflow-hidden border-b-2 border-[var(--ui-bg)] pixel-checkerboard flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]"
              aria-label={name}
            >
              {!failedImages[coverSprite.id] ? (
                <img
                  src={coverSprite.src}
                  alt={lang === 'ru' ? coverSprite.titleRu : coverSprite.titleEn}
                  referrerPolicy="no-referrer"
                  onError={() => markImageFailed(coverSprite.id)}
                  className="max-h-[84%] max-w-[84%] object-contain pixelated transition-transform duration-300 ease-out group-hover/thumb:scale-105 drop-shadow-[0_14px_28px_rgba(0,0,0,0.7)]"
                />
              ) : (
                <span className="font-display text-base text-[var(--ui-text)]">{name}</span>
              )}
            </button>
          )}

          {/* Desktop Filmstrip Carousel Emerging Out of Category Window */}
          <AnimatePresence>
            {isHovered && hasSprites && (
              <motion.div
                key="desktop-filmstrip"
                initial={{
                  opacity: 0,
                  scaleX: 0.08,
                  x: side === 'left' ? -12 : 12,
                }}
                animate={{
                  opacity: 1,
                  scaleX: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  scaleX: 0.08,
                  x: side === 'left' ? -12 : 12,
                }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  transformOrigin: side === 'left' ? 'left center' : 'right center',
                }}
                className={`hidden lg:flex flex-col justify-between absolute top-0 h-[370px] w-[min(580px,44vw)] z-50 border-2 border-[var(--ui-accent)] bg-[var(--ui-deep)] shadow-[0_24px_75px_rgba(0,0,0,0.88)] overflow-hidden ${
                  side === 'left'
                    ? 'left-[calc(100%-2px)] rounded-r-2xl border-l-0'
                    : 'right-[calc(100%-2px)] rounded-l-2xl border-r-0'
                }`}
              >
                <div
                  className="h-4 w-full bg-[var(--ui-bg)] border-b border-[var(--ui-border)] film-sprockets opacity-95 shrink-0"
                  aria-hidden="true"
                />

                <div
                  ref={viewportRef}
                  className="relative flex-1 flex items-center overflow-hidden bg-[var(--ui-header)]"
                >
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[var(--ui-deep)] to-transparent z-10" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[var(--ui-deep)] to-transparent z-10" />

                  <div
                    ref={trackRef}
                    className="flex items-center gap-4 px-2 py-3 w-max will-change-transform"
                  >
                    {loopedReel.map((entry, idx) => (
                      <button
                        key={`${entry.sprite.id}-${idx}`}
                        type="button"
                        data-nebula-light="true"
                        onMouseEnter={() => setIsFrameHovered(true)}
                        onMouseLeave={() => setIsFrameHovered(false)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSprite(category, entry.originalIndex);
                        }}
                        className="group/frame relative w-[210px] h-[270px] shrink-0 rounded-xl border-2 border-[var(--ui-border)] hover:border-[var(--ui-accent)] bg-[var(--ui-surface-alt)] overflow-hidden flex items-center justify-center p-4 cursor-pointer transition-transform duration-150 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]"
                        title={lang === 'ru' ? entry.sprite.titleRu : entry.sprite.titleEn}
                      >
                        {!failedImages[entry.sprite.id] ? (
                          <img
                            src={entry.sprite.src}
                            alt={lang === 'ru' ? entry.sprite.titleRu : entry.sprite.titleEn}
                            referrerPolicy="no-referrer"
                            onError={() => markImageFailed(entry.sprite.id)}
                            className="max-h-full max-w-full object-contain pixelated transition-transform duration-200 group-hover/frame:scale-110"
                          />
                        ) : (
                          <span className="font-mono text-xs text-[var(--ui-accent)]">
                            #{entry.originalIndex + 1}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="h-4 w-full bg-[var(--ui-bg)] border-t border-[var(--ui-border)] film-sprockets opacity-95 shrink-0"
                  aria-hidden="true"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Category Title, Prominent Minimum Price & Expressive Description */}
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-3.5">
          <div className="flex flex-col gap-2.5">
            <h3 className="font-display text-lg sm:text-2xl font-bold text-white tracking-tight leading-snug">
              {name}
            </h3>

            <div
              style={{ boxShadow: '0 0 14px rgba(var(--ui-glow-rgb), 0.14)' }}
              className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-xl border border-[var(--ui-accent)]/45 border-l-4 border-l-[#e6c453] bg-[var(--ui-price-bg)] px-4 py-2.5 transition-colors duration-700"
            >
              <span className="text-xs sm:text-sm font-semibold text-[var(--ui-text)]/90">
                {lang === 'ru' ? 'Минимальная цена:' : 'Min. price:'}
              </span>
              <span className="font-mono text-lg sm:text-2xl font-bold text-[#f4d35e] tabular-nums tracking-tight">
                {formatCategoryMinAmount(category.priceSummaryRub, currency, lang)}
              </span>
            </div>
          </div>

          <p className="text-[15px] sm:text-[17px] text-[var(--ui-text-bright)] leading-relaxed transition-colors duration-700">
            {description}
          </p>

          {note && (
            <p className="text-sm sm:text-[15px] text-[var(--ui-accent-bright)]/90 italic">
              {note}
            </p>
          )}

          {/* Always-Visible Touch-Scrollable Filmstrip Reel for Phones & Tablets */}
          {hasSprites && (
            <div className="lg:hidden pt-1.5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--ui-accent-soft)]">
                  <Film className="w-3.5 h-3.5 text-[var(--ui-accent)] shrink-0" />
                  <span>
                    {lang === 'ru'
                      ? `Лента работ · ${category.sprites.length}`
                      : `Works reel · ${category.sprites.length}`}
                  </span>
                </span>

                {category.sprites.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => scrollMobileReel(-1)}
                      aria-label={lang === 'ru' ? 'Прокрутить влево' : 'Scroll left'}
                      className="p-1.5 rounded-lg border border-[var(--ui-border-strong)] bg-[var(--ui-surface-alt)] active:bg-[var(--ui-card-hover)] text-[var(--ui-text)] cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollMobileReel(1)}
                      aria-label={lang === 'ru' ? 'Прокрутить вправо' : 'Scroll right'}
                      className="p-1.5 rounded-lg border border-[var(--ui-border-strong)] bg-[var(--ui-surface-alt)] active:bg-[var(--ui-card-hover)] text-[var(--ui-text)] cursor-pointer transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[var(--ui-border-strong)] bg-[var(--ui-deep)] overflow-hidden transition-colors duration-700">
                <div className="h-2.5 w-full bg-[var(--ui-bg)] border-b border-[var(--ui-border)] film-sprockets opacity-85" aria-hidden="true" />
                <div
                  ref={mobileReelRef}
                  className="flex items-center gap-2.5 overflow-x-auto snap-x snap-mandatory touch-pan-x overscroll-x-contain no-scrollbar px-3 py-2.5"
                >
                  {category.sprites.map((sp, idx) => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => onOpenSprite(category, idx)}
                      className="w-[128px] h-[128px] sm:w-[152px] sm:h-[152px] shrink-0 snap-start rounded-lg border border-[var(--ui-border)] active:border-[var(--ui-accent)] bg-[var(--ui-surface-alt)] p-2.5 flex items-center justify-center cursor-pointer transition-colors"
                      aria-label={lang === 'ru' ? sp.titleRu : sp.titleEn}
                    >
                      {!failedImages[sp.id] ? (
                        <img
                          src={sp.src}
                          alt={lang === 'ru' ? sp.titleRu : sp.titleEn}
                          referrerPolicy="no-referrer"
                          onError={() => markImageFailed(sp.id)}
                          className="max-h-full max-w-full object-contain pixelated"
                        />
                      ) : (
                        <span className="font-mono text-xs text-[var(--ui-accent)]">
                          #{idx + 1}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="h-2.5 w-full bg-[var(--ui-bg)] border-t border-[var(--ui-border)] film-sprockets opacity-85" aria-hidden="true" />
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
