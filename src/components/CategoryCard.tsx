import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Film, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Currency,
  DEFAULT_USD_RATE,
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
  usdRate?: number;
  onOpenSprite: (category: PortfolioCategory, spriteIndex: number) => void;
}

export function CategoryCard({
  category,
  side,
  lang,
  currency,
  usdRate = DEFAULT_USD_RATE,
  onOpenSprite,
}: CategoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isParticleHovered, setIsParticleHovered] = useState(false);
  const [isReelClosing, setIsReelClosing] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const hasSprites = category.sprites.length > 0;

  const mixedSprites = useMemo(() => {
    const entries = category.sprites.map((sprite, idx) => ({
      sprite,
      originalIndex: idx,
    }));
    for (let i = entries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [entries[i], entries[j]] = [entries[j], entries[i]];
    }
    return entries;
  }, [category.sprites]);

  const [activeOriginalIndex, setActiveOriginalIndex] = useState<number>(
    () => mixedSprites[0]?.originalIndex ?? 0
  );
  const activeOriginalIndexRef = useRef<number>(activeOriginalIndex);
  activeOriginalIndexRef.current = activeOriginalIndex;

  useEffect(() => {
    const firstIdx = mixedSprites[0]?.originalIndex ?? 0;
    activeOriginalIndexRef.current = firstIdx;
    setActiveOriginalIndex(firstIdx);
  }, [mixedSprites]);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const mobileReelRef = useRef<HTMLDivElement | null>(null);
  const isWingHoveredRef = useRef<boolean>(false);
  const offsetRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const wheelPauseUntilRef = useRef<number>(0);
  const isHoveredRef = useRef(isHovered);
  isHoveredRef.current = isHovered;
  const isReelClosingRef = useRef(isReelClosing);
  isReelClosingRef.current = isReelClosing;
  const wasReelOpenRef = useRef(false);
  const [isReelRevealed, setIsReelRevealed] = useState(false);
  const [openingStartIdx, setOpeningStartIdx] = useState(0);
  const [closingSlotDomIdx, setClosingSlotDomIdx] = useState<number | null>(null);
  const closingGlideRef = useRef<{
    startOffset: number;
    targetOffset: number;
    startTime: number;
    durationMs: number;
  } | null>(null);
  const [wingWidthPx, setWingWidthPx] = useState<number>(420);
  const [sideMarginPx, setSideMarginPx] = useState<number>(55);

  const coverSprite = hasSprites
    ? category.sprites[activeOriginalIndex] ?? category.sprites[0]
    : undefined;

  const reelEntries = useMemo(() => {
    if (mixedSprites.length === 0) return [];
    const filled: Array<{ sprite: PortfolioSprite; originalIndex: number }> = [];
    while (filled.length < Math.max(8, mixedSprites.length)) {
      mixedSprites.forEach((entry) => {
        filled.push(entry);
      });
    }
    return filled;
  }, [mixedSprites]);

  // 3 copies guarantee >= 3500px buffer on BOTH left and right sides at all times
  const loopedReel = useMemo(
    () => [...reelEntries, ...reelEntries, ...reelEntries],
    [reelEntries]
  );

  const findClosestChildIndex = (track: HTMLDivElement, targetTrackX: number) => {
    const children = track.children;
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < children.length; i++) {
      const el = children[i] as HTMLElement;
      const center = el.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(center - targetTrackX);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  // Synchronously align central sprite inside middle copy before first paint when hover opens
  useLayoutEffect(() => {
    if (!isHovered || !hasSprites || reelEntries.length === 0) return;
    const track = trackRef.current;
    const vp = viewportRef.current;
    const card = cardRef.current;
    if (!track || !vp || !card) return;

    const oneLoopWidth = track.scrollWidth / 3;
    if (oneLoopWidth <= 0) return;

    if (wasReelOpenRef.current) {
      let current = offsetRef.current;
      while (current < oneLoopWidth) current += oneLoopWidth;
      while (current >= oneLoopWidth * 2) current -= oneLoopWidth;
      offsetRef.current = current;
      track.style.transform = `translate3d(${-current}px, 0, 0)`;
      return;
    }

    const cardRect = card.getBoundingClientRect();
    const vpRect = vp.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2 - vpRect.left;

    const startIdx = Math.max(
      0,
      reelEntries.findIndex(
        (entry) => entry.originalIndex === activeOriginalIndexRef.current
      )
    );
    const targetEl = track.children[reelEntries.length + startIdx] as
      | HTMLElement
      | undefined;
    if (!targetEl) return;

    const targetCenter = targetEl.offsetLeft + targetEl.offsetWidth / 2;
    let initial = targetCenter - cardCenterX;
    while (initial < oneLoopWidth) initial += oneLoopWidth;
    while (initial >= oneLoopWidth * 2) initial -= oneLoopWidth;
    offsetRef.current = initial;
    track.style.transform = `translate3d(${-initial}px, 0, 0)`;
  }, [isHovered, hasSprites, reelEntries]);

  // Frame-rate independent smooth reel loop + inertial mouse-wheel glide + smooth glide-to-center on close
  useEffect(() => {
    const active = isHovered || isReelClosing;
    wasReelOpenRef.current = active;
    if (!active || !hasSprites || reelEntries.length === 0) {
      velocityRef.current = 0;
      isWingHoveredRef.current = false;
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let lastTickTime = performance.now();
    const captureReadyAt = lastTickTime + 400;

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTickTime) / 1000));
      lastTickTime = now;
      const step60 = dt * 60;

      const track = trackRef.current;
      const vp = viewportRef.current;
      const card = cardRef.current;
      if (track && vp && card) {
        if (!isHoveredRef.current && closingGlideRef.current) {
          const { startOffset, targetOffset, startTime, durationMs } =
            closingGlideRef.current;
          const t = Math.min(1, Math.max(0, (now - startTime) / durationMs));
          const eased = 1 - Math.pow(1 - t, 3);
          const next = startOffset + (targetOffset - startOffset) * eased;
          offsetRef.current = next;
          track.style.transform = `translate3d(${-next}px, 0, 0)`;
          if (t < 1) {
            rafId = requestAnimationFrame(tick);
          }
          return;
        }

        const oneLoopWidth = track.scrollWidth / 3;
        if (oneLoopWidth > 0) {
          const cardRect = card.getBoundingClientRect();
          const vpRect = vp.getBoundingClientRect();
          const cardCenterX = cardRect.left + cardRect.width / 2 - vpRect.left;

          const canDrift =
            !prefersReducedMotion &&
            !isWingHoveredRef.current &&
            now > captureReadyAt &&
            now > wheelPauseUntilRef.current;

          const driftRamp = canDrift
            ? Math.min(1, (now - captureReadyAt) / 260)
            : 0;

          const autoDrift = canDrift
            ? (side === 'left' ? -0.9 : 0.9) * driftRamp * step60
            : 0;

          velocityRef.current *= Math.pow(0.91, step60);
          if (Math.abs(velocityRef.current) < 0.02) {
            velocityRef.current = 0;
          }

          let next = offsetRef.current + autoDrift + velocityRef.current * step60;
          while (next < oneLoopWidth) next += oneLoopWidth;
          while (next >= oneLoopWidth * 2) next -= oneLoopWidth;

          let landedOriginalIndex: number | null = null;
          if (category.sprites.length > 1) {
            const bestDomIdx = findClosestChildIndex(track, next + cardCenterX);
            const landedEntry = reelEntries[bestDomIdx % reelEntries.length];
            if (landedEntry) {
              landedOriginalIndex = landedEntry.originalIndex;
            }
          }

          offsetRef.current = next;
          track.style.transform = `translate3d(${-next}px, 0, 0)`;

          if (
            landedOriginalIndex !== null &&
            landedOriginalIndex !== activeOriginalIndexRef.current
          ) {
            activeOriginalIndexRef.current = landedOriginalIndex;
            setActiveOriginalIndex(landedOriginalIndex);
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isHovered, isReelClosing, hasSprites, reelEntries, category.sprites.length, side]);

  // Non-passive wheel listener anywhere inside the active filmstrip
  useEffect(() => {
    if (!isHovered || !hasSprites) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let rawDelta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (e.deltaMode === 1) rawDelta *= 32;
      else if (e.deltaMode === 2) rawDelta *= 240;

      const impulse = Math.max(-9, Math.min(9, rawDelta * 0.065));
      velocityRef.current = Math.max(-18, Math.min(18, velocityRef.current + impulse));
      wheelPauseUntilRef.current = performance.now() + 1200;
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      viewport.removeEventListener('wheel', handleWheel);
    };
  }, [isHovered, hasSprites]);

  // Trigger fade-in of neighbors and divider lines after initial opacity-0 paint
  useEffect(() => {
    if (!isHovered || !hasSprites) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setIsReelRevealed(true);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [isHovered, hasSprites]);

  // Safety fallback cleanup in case tab loses focus during closing animation
  useEffect(() => {
    if (!isReelClosing || isHovered) return;
    const timer = window.setTimeout(() => {
      if (!isHoveredRef.current && isReelClosingRef.current) {
        closingGlideRef.current = null;
        setClosingSlotDomIdx(null);
        setIsReelRevealed(false);
        setIsReelClosing(false);
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [isReelClosing, isHovered]);

  const handleMouseEnter = () => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(hover: hover)').matches
    ) {
      setIsParticleHovered(true);
    }
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
    if (typeof window !== 'undefined') {
      setWingWidthPx(Math.min(440, Math.round(window.innerWidth * 0.34)));
    }
    if (cardRef.current) {
      const cardW = cardRef.current.clientWidth;
      setSideMarginPx(Math.max(0, Math.round(cardW / 2 - 140)));
    }
    if (!wasReelOpenRef.current) {
      const startIdx = Math.max(
        0,
        reelEntries.findIndex(
          (entry) => entry.originalIndex === activeOriginalIndexRef.current
        )
      );
      setOpeningStartIdx(startIdx);
      setIsReelRevealed(false);
    }
    closingGlideRef.current = null;
    setClosingSlotDomIdx(null);
    setIsReelClosing(false);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsParticleHovered(false);
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      if (isHoveredRef.current) {
        const vp = viewportRef.current;
        const track = trackRef.current;
        const card = cardRef.current;
        if (vp && track && card && reelEntries.length > 0) {
          const cardRect = card.getBoundingClientRect();
          const vpRect = vp.getBoundingClientRect();
          const cardCenterX = cardRect.left + cardRect.width / 2 - vpRect.left;
          const bestDomIdx = findClosestChildIndex(
            track,
            offsetRef.current + cardCenterX
          );
          const bestEl = track.children[bestDomIdx] as HTMLElement | undefined;
          if (bestEl) {
            const targetOffset =
              bestEl.offsetLeft + bestEl.offsetWidth / 2 - cardCenterX;
            const landedEntry = reelEntries[bestDomIdx % reelEntries.length];
            if (
              landedEntry &&
              landedEntry.originalIndex !== activeOriginalIndexRef.current
            ) {
              activeOriginalIndexRef.current = landedEntry.originalIndex;
              setActiveOriginalIndex(landedEntry.originalIndex);
            }
            closingGlideRef.current = {
              startOffset: offsetRef.current,
              targetOffset,
              startTime: performance.now(),
              durationMs: 340,
            };
            setClosingSlotDomIdx(bestDomIdx);
          }
        }
        velocityRef.current = 0;
        setIsReelClosing(true);
        setIsHovered(false);
      }
      isWingHoveredRef.current = false;
    }, 45);
  };

  const handleMobileScroll = () => {
    const reel = mobileReelRef.current;
    if (!reel || mixedSprites.length <= 1) return;
    const center = reel.scrollLeft + reel.clientWidth / 2;
    let bestDist = Infinity;
    let bestIdx = activeOriginalIndexRef.current;
    const children = reel.children;
    for (let i = 0; i < children.length; i++) {
      const el = children[i] as HTMLElement;
      const elCenter = el.offsetLeft + el.offsetWidth / 2;
      const d = Math.abs(elCenter - center);
      if (d < bestDist && mixedSprites[i]) {
        bestDist = d;
        bestIdx = mixedSprites[i].originalIndex;
      }
    }
    if (bestIdx !== activeOriginalIndexRef.current) {
      activeOriginalIndexRef.current = bestIdx;
      setActiveOriginalIndex(bestIdx);
    }
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
        ref={cardRef}
        data-nebula-light="true"
        style={
          isHovered
            ? { boxShadow: '0 0 28px rgba(var(--ui-glow-rgb), 0.2)' }
            : undefined
        }
        className={`relative rounded-2xl border-2 bg-[var(--ui-card)]/95 overflow-visible transition-all duration-500 shadow-[0_14px_40px_rgba(0,0,0,0.6)] ${
          isHovered
            ? `border-[var(--ui-accent)] ${
                hasSprites
                  ? side === 'left'
                    ? 'lg:rounded-tr-none'
                    : 'lg:rounded-tl-none'
                  : ''
              }`
            : 'border-[var(--ui-border)] hover:border-[var(--ui-accent)]'
        }`}
      >
        {/* Artwork Checkerboard Window + External Emerging Filmstrip */}
        <div className="relative">
          {category.customAvatar === 'particle-question' || !coverSprite ? (
            <div
              className="relative w-full h-[220px] sm:h-[290px] lg:h-[370px] rounded-t-[14px] overflow-hidden border-b-2 border-[var(--ui-bg)] pixel-checkerboard flex items-center justify-center"
              aria-label={name}
            >
              <ParticleQuestionMark isHovered={isParticleHovered} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenSprite(category, activeOriginalIndex)}
              className={`group/thumb relative w-full h-[220px] sm:h-[290px] lg:h-[370px] rounded-t-[14px] ${
                isHovered && hasSprites
                  ? side === 'left'
                    ? 'lg:rounded-tr-none'
                    : 'lg:rounded-tl-none'
                  : ''
              } overflow-hidden border-b-2 border-[var(--ui-bg)] pixel-checkerboard flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]`}
              aria-label={name}
            >
              {!failedImages[coverSprite.id] ? (
                <img
                  src={coverSprite.src}
                  alt={lang === 'ru' ? coverSprite.titleRu : coverSprite.titleEn}
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => markImageFailed(coverSprite.id)}
                  className={`w-[180px] h-[170px] sm:w-[236px] sm:h-[224px] lg:w-[264px] lg:h-[256px] object-contain pixelated transition-transform duration-300 ease-out group-hover/thumb:scale-105 drop-shadow-[0_14px_28px_rgba(0,0,0,0.7)] ${
                    (isHovered || isReelClosing) && hasSprites ? 'lg:opacity-0' : ''
                  }`}
                />
              ) : (
                <span className="font-display text-base text-[var(--ui-text)]">{name}</span>
              )}
            </button>
          )}

          {/* External Filmstrip Texture, Checkerboard Grid & Border (ONLY outside the card boundary) */}
          {(isHovered || isReelClosing) && hasSprites && (
            <div
              key="desktop-filmstrip-sleeve"
              style={{
                width: wingWidthPx,
                clipPath:
                  side === 'left'
                    ? 'inset(-40px -40px -60px 0px)'
                    : 'inset(-40px 0px -60px -40px)',
              }}
              className={`hidden lg:block absolute top-[-2px] h-[372px] z-40 pointer-events-none ${
                side === 'left' ? 'left-[calc(100%-2px)]' : 'right-[calc(100%-2px)]'
              }`}
              aria-hidden="true"
            >
              <motion.div
                initial={{
                  x: side === 'left' ? -wingWidthPx : wingWidthPx,
                  opacity: 0.35,
                }}
                animate={{
                  x: isHovered ? 0 : side === 'left' ? -wingWidthPx : wingWidthPx,
                  opacity: isHovered ? 1 : 0,
                }}
                transition={{
                  duration: isHovered ? 0.4 : 0.36,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  boxShadow:
                    '0 0 28px rgba(var(--ui-glow-rgb), 0.2), 0 24px 70px rgba(0, 0, 0, 0.85)',
                }}
                className={`flex flex-col justify-between w-full h-full border-2 border-[var(--ui-accent)] bg-[var(--ui-deep)] overflow-hidden ${
                  side === 'left'
                    ? 'rounded-r-2xl border-l-0'
                    : 'rounded-l-2xl border-r-0'
                }`}
              >
                <div className="h-4 w-full bg-[var(--ui-bg)] border-b border-[var(--ui-border)] film-sprockets opacity-95 shrink-0" />
                <div
                  className="flex-1 w-full pixel-checkerboard"
                  style={{
                    backgroundPosition: '0 2px, 0 10px, 8px -6px, -8px 2px',
                  }}
                />
                <div className="h-4 w-full bg-[var(--ui-bg)] border-t border-[var(--ui-border)] film-sprockets opacity-95 shrink-0" />
              </motion.div>
            </div>
          )}

          {/* Transparent Scrolling Sprites Track (Seamless Across Card Checkerboard + Filmstrip) */}
          {(isHovered || isReelClosing) && hasSprites && (
            <motion.div
              key="desktop-filmstrip-sprites"
              ref={viewportRef}
              initial={{
                clipPath:
                  side === 'left'
                    ? `inset(0px ${wingWidthPx + sideMarginPx}px 0px ${sideMarginPx}px)`
                    : `inset(0px ${sideMarginPx}px 0px ${wingWidthPx + sideMarginPx}px)`,
              }}
              animate={{
                clipPath: isHovered
                  ? 'inset(0px 0px 0px 0px)'
                  : side === 'left'
                    ? `inset(0px ${wingWidthPx}px 0px 0px)`
                    : `inset(0px 0px 0px ${wingWidthPx}px)`,
              }}
              transition={{
                duration: isHovered ? 0.4 : 0.36,
                ease: [0.22, 1, 0.36, 1],
              }}
              onAnimationComplete={() => {
                if (!isHoveredRef.current && isReelClosingRef.current) {
                  closingGlideRef.current = null;
                  setClosingSlotDomIdx(null);
                  setIsReelRevealed(false);
                  setIsReelClosing(false);
                }
              }}
              style={{
                width: `calc(100% + ${Math.max(0, wingWidthPx - 4)}px)`,
              }}
              onMouseMove={(e) => {
                const rect = cardRef.current?.getBoundingClientRect();
                isWingHoveredRef.current = rect
                  ? e.clientX < rect.left || e.clientX > rect.right
                  : false;
              }}
              onMouseLeave={() => {
                isWingHoveredRef.current = false;
              }}
              className={`hidden lg:flex items-center absolute top-0 h-[368px] z-50 overflow-hidden bg-transparent ${
                side === 'left'
                  ? 'left-0 rounded-tl-[14px] rounded-r-[14px]'
                  : 'right-0 rounded-tr-[14px] rounded-l-[14px]'
              }`}
            >
              <div
                ref={trackRef}
                className="flex items-center gap-0 pl-0 pr-0 w-max shrink-0 will-change-transform"
              >
                {loopedReel.map((entry, idx) => {
                  const isHiddenOpening =
                    !isReelRevealed &&
                    !isReelClosing &&
                    idx % reelEntries.length !== openingStartIdx;
                  const isFadingOut =
                    isReelClosing &&
                    closingSlotDomIdx !== null &&
                    idx !== closingSlotDomIdx;
                  const dividerVisible = isReelRevealed && !isReelClosing;
                  return (
                    <div
                      key={`${entry.sprite.id}-${idx}`}
                      className="relative flex items-center shrink-0"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          activeOriginalIndexRef.current = entry.originalIndex;
                          setActiveOriginalIndex(entry.originalIndex);
                          onOpenSprite(category, entry.originalIndex);
                        }}
                        className={`group/frame relative h-[288px] px-4 shrink-0 flex items-center justify-center cursor-pointer transition-[transform,opacity] duration-300 ease-out focus-visible:outline-none ${
                          isReelClosing ? 'scale-100 pointer-events-none' : 'hover:scale-105'
                        } ${isHiddenOpening || isFadingOut ? 'opacity-0' : 'opacity-100'}`}
                        title={lang === 'ru' ? entry.sprite.titleRu : entry.sprite.titleEn}
                      >
                        {!failedImages[entry.sprite.id] ? (
                          <img
                            src={entry.sprite.src}
                            alt={lang === 'ru' ? entry.sprite.titleRu : entry.sprite.titleEn}
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={() => markImageFailed(entry.sprite.id)}
                            className="w-[264px] h-[256px] object-contain pixelated drop-shadow-[0_14px_28px_rgba(0,0,0,0.7)]"
                          />
                        ) : (
                          <span className="font-mono text-xs text-[var(--ui-accent)]">
                            #{entry.originalIndex + 1}
                          </span>
                        )}
                      </button>

                      {/* Clean solid colored divider bar between neighboring sprites */}
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-[2px] h-[268px] rounded-full bg-[var(--ui-accent)]/75 transition-opacity duration-300 ease-out ${
                          dividerVisible ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Category Title, Expressive Minimum Price & Description */}
        <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
          <div className="flex flex-col gap-2.5">
            <h3 className="font-display text-lg sm:text-2xl font-bold text-white tracking-tight leading-snug">
              {name}
            </h3>

            <div className="w-fit max-w-full">
              <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 leading-snug">
                <span className="text-[17px] sm:text-[20px] font-semibold text-white tracking-tight">
                  {lang === 'ru' ? 'Минимальная цена:' : 'Min. price:'}
                </span>
                <span className="font-mono text-[22px] sm:text-[28px] font-extrabold text-[#f4d35e] tabular-nums tracking-tight">
                  {formatCategoryMinAmount(category.priceSummaryRub, currency, lang, usdRate)}
                </span>
              </p>
              <div
                className="mt-1.5 h-[2px] w-full rounded-full bg-gradient-to-r from-[var(--ui-accent-bright)] via-[var(--ui-accent)]/75 to-transparent"
                aria-hidden="true"
              />
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
                  onScroll={handleMobileScroll}
                  className="flex items-center gap-2.5 overflow-x-auto snap-x snap-mandatory touch-pan-x overscroll-x-contain no-scrollbar px-3 py-2.5"
                >
                  {mixedSprites.map((entry, idx) => (
                    <button
                      key={entry.sprite.id}
                      type="button"
                      onClick={() => {
                        activeOriginalIndexRef.current = entry.originalIndex;
                        setActiveOriginalIndex(entry.originalIndex);
                        onOpenSprite(category, entry.originalIndex);
                      }}
                      className={`w-[128px] h-[128px] sm:w-[152px] sm:h-[152px] shrink-0 snap-start rounded-lg border p-2.5 flex items-center justify-center cursor-pointer transition-colors pixel-checkerboard ${
                        entry.originalIndex === activeOriginalIndex && category.sprites.length > 1
                          ? 'border-[var(--ui-accent)]'
                          : 'border-[var(--ui-border)] active:border-[var(--ui-accent)]'
                      }`}
                      aria-label={lang === 'ru' ? entry.sprite.titleRu : entry.sprite.titleEn}
                    >
                      {!failedImages[entry.sprite.id] ? (
                        <img
                          src={entry.sprite.src}
                          alt={lang === 'ru' ? entry.sprite.titleRu : entry.sprite.titleEn}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={() => markImageFailed(entry.sprite.id)}
                          className="w-full h-full object-contain pixelated"
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
