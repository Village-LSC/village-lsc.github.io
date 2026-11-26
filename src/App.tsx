import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Coins,
  EyeOff,
  Globe,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  Currency,
  DEFAULT_USD_RATE,
  Language,
  PORTFOLIO_CATEGORIES,
  PortfolioCategory,
  SOCIAL_LINKS,
  SocialLinkItem,
} from './data/portfolioData';
import { DitherNebula } from './components/DitherNebula';
import { CategoryCard } from './components/CategoryCard';
import { PricingAndTermsSection } from './components/PricingAndTermsSection';
import { ReadyPacksSection } from './components/ReadyPacksSection';
import { ContactAndPaymentSection } from './components/ContactAndPaymentSection';
import { SpriteLightboxModal } from './components/SpriteLightboxModal';
import { SocialIcon } from './components/SocialIcons';
import { applyNebulaUiTheme } from './theme/nebulaThemes';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('village_lang');
      return saved === 'en' ? 'en' : 'ru';
    } catch {
      return 'ru';
    }
  });

  const [currency, setCurrency] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem('village_currency');
      return saved === 'usd' ? 'usd' : 'rub';
    } catch {
      return 'rub';
    }
  });

  const [usdRate, setUsdRate] = useState<number>(DEFAULT_USD_RATE);

  useEffect(() => {
    let isCancelled = false;
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data?.rates?.RUB && typeof data.rates.RUB === 'number') {
          const fetchedRate = Number(data.rates.RUB.toFixed(1));
          if (fetchedRate > 50 && fetchedRate < 200) {
            setUsdRate(fetchedRate);
          }
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_USD_RATE (82)
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  const [isBgEnabled, setIsBgEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('village_bg_enabled');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const [dominantRampIdx, setDominantRampIdx] = useState<number>(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [copiedSocialId, setCopiedSocialId] = useState<string | null>(null);
  const [showLagPrompt, setShowLagPrompt] = useState(false);
  const [lagPromptDismissed, setLagPromptDismissed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicWantedRef = useRef(true);
  const musicBtnRef = useRef<HTMLButtonElement | null>(null);

  const [lightboxState, setLightboxState] = useState<{
    category: PortfolioCategory | null;
    spriteIndex: number;
  }>({
    category: null,
    spriteIndex: 0,
  });

  useEffect(() => {
    applyNebulaUiTheme(isBgEnabled ? dominantRampIdx : 0);
  }, [isBgEnabled, dominantRampIdx]);

  useEffect(() => {
    if (!isBgEnabled) {
      setShowLagPrompt(false);
    }
  }, [isBgEnabled]);

  const handlePerformanceLagDetected = useCallback(() => {
    setShowLagPrompt((prev) => {
      if (prev || lagPromptDismissed || !isBgEnabled) return prev;
      return true;
    });
  }, [lagPromptDismissed, isBgEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('village_lang', lang);
    } catch {
      // ignore storage errors
    }
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem('village_currency', currency);
    } catch {
      // ignore storage errors
    }
  }, [currency]);

  useEffect(() => {
    try {
      localStorage.setItem('village_bg_enabled', String(isBgEnabled));
    } catch {
      // ignore storage errors
    }
  }, [isBgEnabled]);

  const getOrCreateAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio('/lobby.mp3');
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0.28;
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  useEffect(() => {
    const audio = getOrCreateAudio();
    musicWantedRef.current = true;

    const attemptPlay = () => {
      if (!musicWantedRef.current) return;
      if (!audio.paused) {
        setIsMusicPlaying(true);
        return;
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (musicWantedRef.current) {
              setIsMusicPlaying(true);
            }
          })
          .catch(() => {
            // Browser blocked unmuted autoplay before user gesture; listeners below will unlock it.
          });
      }
    };

    const handleUserGesture = (e: Event) => {
      if (!musicWantedRef.current) return;
      if (e.target instanceof Node && musicBtnRef.current?.contains(e.target)) {
        return;
      }
      if (audio.paused) {
        attemptPlay();
      }
    };

    const gestureEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'mousedown',
      'touchstart',
      'keydown',
      'click',
    ];

    attemptPlay();
    gestureEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserGesture, { capture: true, passive: true });
    });

    return () => {
      gestureEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserGesture, { capture: true });
      });
      audio.pause();
      audioRef.current = null;
    };
  }, [getOrCreateAudio]);

  const toggleMusic = () => {
    const audio = getOrCreateAudio();

    if (isMusicPlaying && !audio.paused) {
      musicWantedRef.current = false;
      audio.pause();
      setIsMusicPlaying(false);
    } else if (isMusicPlaying && audio.paused) {
      musicWantedRef.current = true;
      audio
        .play()
        .then(() => setIsMusicPlaying(true))
        .catch(() => {});
    } else {
      musicWantedRef.current = true;
      audio
        .play()
        .then(() => setIsMusicPlaying(true))
        .catch(() => setIsMusicPlaying(true));
    }
  };

  const handleSocialCopy = (item: SocialLinkItem) => {
    if (!item.copyText) return;
    navigator.clipboard.writeText(item.copyText);
    setCopiedSocialId(item.id);
    window.setTimeout(() => {
      setCopiedSocialId((prev) => (prev === item.id ? null : prev));
    }, 1800);
  };

  const handleOpenSprite = (category: PortfolioCategory, spriteIndex: number) => {
    setLightboxState({ category, spriteIndex });
  };

  const handleCloseLightbox = () => {
    setLightboxState({ category: null, spriteIndex: 0 });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--ui-bg)] text-[var(--ui-text)] font-sans relative overflow-x-clip transition-colors duration-700">
      {/* Lively Dark Cosmos with Adaptive Palette Matching UI */}
      <DitherNebula
        enabled={isBgEnabled}
        paused={lightboxState.category !== null}
        onDominantPaletteChange={setDominantRampIdx}
        onPerformanceLagDetected={handlePerformanceLagDetected}
      />

      {/* Pinned Top Bar with Expressive System Controls */}
      <header className="sticky top-0 z-50 border-b-2 border-[var(--ui-border)] bg-[var(--ui-header)]/95 shadow-[0_6px_28px_rgba(0,0,0,0.45)] transition-colors duration-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-6">
          <a
            href="#top"
            data-nebula-light="true"
            onClick={(e) => {
              e.preventDefault();
              scrollToTop();
            }}
            className="font-display text-base sm:text-xl font-bold tracking-tight text-[#fbf7ff] hover:text-[var(--ui-accent)] transition-colors whitespace-nowrap shrink-0 rounded-lg px-1.5 sm:px-2 py-1"
          >
            Village_
          </a>

          <nav
            aria-label={lang === 'ru' ? 'Навигация' : 'Navigation'}
            className="hidden lg:flex items-center gap-7 text-sm font-medium text-[var(--ui-text)]/85"
          >
            <a
              href="#showcase"
              data-nebula-light="true"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 rounded-lg px-2 py-1"
            >
              {lang === 'ru' ? 'Работы' : 'Works'}
            </a>
            <a
              href="#pricing-terms"
              data-nebula-light="true"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 rounded-lg px-2 py-1"
            >
              {lang === 'ru' ? 'Цены и условия' : 'Pricing & Terms'}
            </a>
            <a
              href="#ready-packs"
              data-nebula-light="true"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 rounded-lg px-2 py-1"
            >
              {lang === 'ru' ? 'Готовые паки' : 'Ready Packs'}
            </a>
            <a
              href="#contacts-payment"
              data-nebula-light="true"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 rounded-lg px-2 py-1"
            >
              {lang === 'ru' ? 'Контакты' : 'Contacts'}
            </a>
          </nav>

          {/* Expressive Pinned System Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Clear Segmented Language Switcher */}
            <div
              className="inline-flex items-center p-0.5 rounded-xl border-2 border-[var(--ui-border-strong)] bg-[var(--ui-card)]/90 shadow-[0_2px_10px_rgba(0,0,0,0.3)] shrink-0"
              role="group"
              aria-label={lang === 'ru' ? 'Выбор языка' : 'Language'}
            >
              <button
                type="button"
                onClick={() => setLang('ru')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg font-mono text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  lang === 'ru'
                    ? 'bg-[var(--ui-card-hover)] text-white border border-[var(--ui-accent)]/80 shadow-[0_0_10px_rgba(var(--ui-glow-rgb),0.3)]'
                    : 'text-[var(--ui-text-muted)] hover:text-white'
                }`}
                title="Русский язык"
              >
                <Globe className={`w-3.5 h-3.5 shrink-0 ${lang === 'ru' ? 'text-[var(--ui-accent)]' : 'opacity-60'}`} />
                <span>RU</span>
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg font-mono text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  lang === 'en'
                    ? 'bg-[var(--ui-card-hover)] text-white border border-[var(--ui-accent)]/80 shadow-[0_0_10px_rgba(var(--ui-glow-rgb),0.3)]'
                    : 'text-[var(--ui-text-muted)] hover:text-white'
                }`}
                title="English language"
              >
                <span>EN</span>
              </button>
            </div>

            {/* Clear Segmented Currency Switcher with Rate Tooltip */}
            <div
              className="inline-flex items-center p-0.5 rounded-xl border-2 border-[var(--ui-border-strong)] bg-[var(--ui-card)]/90 shadow-[0_2px_10px_rgba(0,0,0,0.3)] shrink-0"
              role="group"
              aria-label={lang === 'ru' ? 'Выбор валюты' : 'Currency'}
              title={
                lang === 'ru'
                  ? `Текущий курс: 1 $ ≈ ${Math.round(usdRate)} ₽`
                  : `Current rate: $1 ≈ ${Math.round(usdRate)} ₽`
              }
            >
              <button
                type="button"
                onClick={() => setCurrency('rub')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg font-mono text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  currency === 'rub'
                    ? 'bg-[var(--ui-card-hover)] text-[#f4d35e] border border-[#e6c453]/80 shadow-[0_0_10px_rgba(244,211,94,0.25)]'
                    : 'text-[var(--ui-text-muted)] hover:text-white'
                }`}
                title={lang === 'ru' ? 'Цены в рублях (₽)' : 'Prices in Rubles (₽)'}
              >
                <Coins className={`w-3.5 h-3.5 shrink-0 ${currency === 'rub' ? 'text-[#f4d35e]' : 'opacity-60'}`} />
                <span>₽</span>
                <span className="hidden sm:inline">RUB</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrency('usd')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg font-mono text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  currency === 'usd'
                    ? 'bg-[var(--ui-card-hover)] text-[#34d399] border border-[#34d399]/80 shadow-[0_0_10px_rgba(52,211,153,0.25)]'
                    : 'text-[var(--ui-text-muted)] hover:text-white'
                }`}
                title={
                  lang === 'ru'
                    ? `Цены в долларах ($) · Курс: 1 $ ≈ ${Math.round(usdRate)} ₽`
                    : `Prices in USD ($) · Rate: $1 ≈ ${Math.round(usdRate)} ₽`
                }
              >
                <span>$</span>
                <span className="hidden sm:inline">USD</span>
              </button>
            </div>

            <button
              ref={musicBtnRef}
              type="button"
              data-nebula-light="true"
              onClick={toggleMusic}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border-2 font-mono text-xs sm:text-sm font-bold active:scale-95 transition-all duration-500 cursor-pointer whitespace-nowrap shrink-0 ${
                isMusicPlaying
                  ? 'border-[var(--ui-accent)] bg-[var(--ui-price-bg)] text-white shadow-[0_0_16px_rgba(var(--ui-glow-rgb),0.22)]'
                  : 'border-[var(--ui-border)] bg-[var(--ui-surface-alt)] text-[var(--ui-accent-soft)]/85 hover:border-[var(--ui-accent)] hover:text-white'
              }`}
              title={lang === 'ru' ? 'Фоновая музыка' : 'Background music'}
            >
              {isMusicPlaying ? (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--ui-accent)] shrink-0" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
              )}
              <span className="hidden sm:inline">
                {lang === 'ru'
                  ? isMusicPlaying
                    ? 'Музыка: ВКЛ'
                    : 'Музыка: ВЫКЛ'
                  : isMusicPlaying
                  ? 'Music: ON'
                  : 'Music: OFF'}
              </span>
            </button>

            <button
              type="button"
              data-nebula-light="true"
              onClick={() => setIsBgEnabled((prev) => !prev)}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border-2 font-mono text-xs sm:text-sm font-bold active:scale-95 transition-all duration-500 cursor-pointer whitespace-nowrap shrink-0 ${
                isBgEnabled
                  ? 'border-[var(--ui-accent)] bg-[var(--ui-price-bg)] text-white shadow-[0_0_16px_rgba(var(--ui-glow-rgb),0.22)]'
                  : 'border-[var(--ui-border)] bg-[var(--ui-surface-alt)] text-[var(--ui-accent-soft)]/85 hover:border-[var(--ui-accent)] hover:text-white'
              }`}
              title={lang === 'ru' ? 'Включить или убрать космический фон' : 'Toggle cosmic background'}
            >
              {isBgEnabled ? (
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--ui-accent)] shrink-0" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#94a3b8] shrink-0" />
              )}
              <span className="hidden md:inline">
                {lang === 'ru'
                  ? isBgEnabled
                    ? 'Фон: ВКЛ'
                    : 'Фон: ВЫКЛ'
                  : isBgEnabled
                  ? 'BG: ON'
                  : 'BG: OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Quick-Jump Navigation Bar */}
        <nav
          aria-label={lang === 'ru' ? 'Разделы сайта' : 'Page sections'}
          className="flex lg:hidden items-center gap-5 overflow-x-auto no-scrollbar px-4 py-2 border-t border-[var(--ui-border)]/70 text-xs sm:text-sm font-medium text-[var(--ui-text)]/85"
        >
          <a href="#showcase" className="hover:text-white whitespace-nowrap shrink-0 py-0.5">
            {lang === 'ru' ? 'Работы' : 'Works'}
          </a>
          <a href="#pricing-terms" className="hover:text-white whitespace-nowrap shrink-0 py-0.5">
            {lang === 'ru' ? 'Цены и условия' : 'Pricing & Terms'}
          </a>
          <a href="#ready-packs" className="hover:text-white whitespace-nowrap shrink-0 py-0.5">
            {lang === 'ru' ? 'Готовые паки' : 'Ready Packs'}
          </a>
          <a href="#contacts-payment" className="hover:text-white whitespace-nowrap shrink-0 py-0.5">
            {lang === 'ru' ? 'Контакты и оплата' : 'Contacts & Pay'}
          </a>
        </nav>
      </header>

      <main id="top" className="relative z-10">
        {/* Hero Screen */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[auto] md:min-h-[82vh] flex items-center py-10 sm:py-16 lg:py-20">
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-9 lg:gap-14 items-center">
            {/* Left Side: Artist Name + Description */}
            <div className="md:col-span-6 lg:col-span-7 text-center md:text-left flex flex-col items-center md:items-start">
              <div className="inline-block bg-[var(--ui-card)] text-[var(--ui-accent-soft)] px-3.5 py-1 rounded-xl font-mono text-xs sm:text-sm tracking-widest border border-[var(--ui-border-strong)] mb-3 sm:mb-4 transition-colors duration-700">
                Pixel Art · PriceList
              </div>

              <h1
                style={{ textShadow: '0 4px 20px rgba(var(--ui-glow-rgb), 0.26)' }}
                className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#fbf7ff]"
              >
                Village_
              </h1>

              <p className="mt-4 sm:mt-5 max-w-xl text-base sm:text-xl text-[var(--ui-text)] leading-relaxed transition-colors duration-700">
                {lang === 'ru' ? (
                  <>
                    Пиксельный художник со стажем{' '}
                    <span className="font-semibold text-[#fbf7ff]">5+ лет</span>. Рисую{' '}
                    <span className="font-semibold text-[#fbf7ff]">спрайты, UI и текстуры</span> — от
                    лаконичного пиксель-арта до детализации в духе{' '}
                    <span className="font-semibold text-[var(--ui-accent-bright)]">
                      Terraria и Calamity
                    </span>
                    .
                  </>
                ) : (
                  <>
                    Pixel art artist with{' '}
                    <span className="font-semibold text-[#fbf7ff]">5+ years</span> of experience.
                    Creating{' '}
                    <span className="font-semibold text-[#fbf7ff]">sprites, UI, and textures</span>{' '}
                    — from clean retro art to{' '}
                    <span className="font-semibold text-[var(--ui-accent-bright)]">
                      Terraria &amp; Calamity
                    </span>{' '}
                    detail.
                  </>
                )}
              </p>

              <a
                href="#showcase"
                data-nebula-light="true"
                style={{ boxShadow: '0 0 18px rgba(var(--ui-glow-rgb), 0.22)' }}
                className="mt-6 sm:mt-8 inline-flex items-center gap-2.5 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl border border-[var(--ui-accent)]/40 bg-[var(--ui-btn-bg)] hover:bg-[var(--ui-btn-hover)] text-[var(--ui-btn-text)] font-semibold text-sm sm:text-base transition-colors duration-500"
              >
                <span>{lang === 'ru' ? 'Смотреть примеры работ' : 'Browse Portfolio'}</span>
                <ArrowDown className="w-4 h-4" />
              </a>
            </div>

            {/* Right Side: Larger Avatar + Social Thumbnails */}
            <div className="md:col-span-6 lg:col-span-5 flex flex-col items-center">
              <div className="w-[min(300px,84vw)] sm:w-[330px] md:w-[300px] lg:w-[360px] flex flex-col items-center">
                {/* Larger Avatar */}
                <div
                  data-nebula-light="true"
                  className="relative group w-full aspect-square rounded-3xl transition-transform duration-300 hover:scale-[1.02]"
                >
                  <div className="absolute -inset-2.5 bg-[var(--ui-accent)]/25 rounded-3xl blur-md opacity-35 group-hover:opacity-70 transition-all duration-500" />
                  <div className="relative w-full h-full bg-[var(--ui-card-hover)] p-2.5 rounded-3xl border-4 border-[var(--ui-bg)] group-hover:border-[var(--ui-accent)] transition-colors duration-500 overflow-hidden shadow-2xl">
                    <img
                      src="/images/avatar.jpg"
                      alt="Village_ Avatar"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>
                </div>

                {/* 6 Social Thumbnails Under Avatar */}
                <div className="mt-4 grid grid-cols-3 gap-3 w-full">
                  {SOCIAL_LINKS.map((item) => {
                    const isCopied = copiedSocialId === item.id;
                    const tileClasses =
                      'group/soc h-[76px] rounded-xl border-2 border-[var(--ui-border)] bg-[var(--ui-card)]/90 hover:border-[var(--ui-accent)] hover:bg-[var(--ui-card-hover)] hover:-translate-y-0.5 flex flex-col items-center justify-center gap-1.5 px-2 transition-all duration-500 shadow-[0_8px_20px_rgba(0,0,0,0.5)] cursor-pointer';

                    if (item.href) {
                      return (
                        <a
                          key={item.id}
                          href={item.href}
                          data-nebula-light="true"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={tileClasses}
                          title={`${item.label}: ${item.value}`}
                        >
                          <SocialIcon
                            id={item.id}
                            className="w-5 h-5 text-[var(--ui-accent)] group-hover/soc:text-white transition-colors"
                          />
                          <span className="text-[11px] font-mono font-semibold text-[var(--ui-text)] group-hover/soc:text-white truncate max-w-full">
                            {item.label}
                          </span>
                        </a>
                      );
                    }

                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-nebula-light="true"
                        onClick={() => handleSocialCopy(item)}
                        className={tileClasses}
                        title={`${item.label}: ${item.value}`}
                      >
                        {isCopied ? (
                          <Check className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <SocialIcon
                            id={item.id}
                            className="w-5 h-5 text-[var(--ui-accent)] group-hover/soc:text-white transition-colors"
                          />
                        )}
                        <span className="text-[11px] font-mono font-semibold text-[var(--ui-text)] group-hover/soc:text-white truncate max-w-full">
                          {isCopied ? (lang === 'ru' ? 'Скопировано' : 'Copied') : item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Larger Portfolio Showcase */}
        <section
          id="showcase"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-12 sm:pb-14 relative z-20"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-8 sm:mb-10">
            <h2
              style={{ textShadow: '0 4px 20px rgba(var(--ui-glow-rgb), 0.26)' }}
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight"
            >
              {lang === 'ru' ? 'Примеры работ' : 'Portfolio'}
            </h2>
            <p className="text-sm sm:text-base font-medium text-[var(--ui-accent-bright)] leading-snug transition-colors duration-700">
              <span className="lg:hidden">
                {lang === 'ru'
                  ? 'Листайте ленту под картинкой · Нажмите на спрайт для приближения'
                  : 'Swipe filmstrip below · Tap any sprite to zoom & download'}
              </span>
              <span className="hidden lg:inline">
                {lang === 'ru'
                  ? 'Наведите на карточку для плёнки · Колёсико крутит ленту · Клик открывает спрайт'
                  : 'Hover for filmstrip · Mouse wheel scrolls reel · Click sprite to zoom & download'}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
            {PORTFOLIO_CATEGORIES.map((category, index) => (
              <div key={category.id}>
                <CategoryCard
                  category={category}
                  side={index % 2 === 0 ? 'left' : 'right'}
                  lang={lang}
                  currency={currency}
                  usdRate={usdRate}
                  onOpenSprite={handleOpenSprite}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Pricing & Terms */}
        <PricingAndTermsSection lang={lang} currency={currency} usdRate={usdRate} />

        {/* Ready-Made Packs */}
        <ReadyPacksSection lang={lang} />

        {/* Contacts & Payment Methods */}
        <ContactAndPaymentSection lang={lang} />
      </main>

      {/* Quiet Footer */}
      <footer className="relative z-10 border-t border-[var(--ui-border)]/80 bg-[var(--ui-header)]/80 transition-colors duration-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between gap-4 text-xs sm:text-sm text-[var(--ui-text-muted)]">
          <span className="font-mono">Village_ · 2026</span>
          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 text-[var(--ui-accent-soft)] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>{lang === 'ru' ? 'Наверх' : 'Top'}</span>
          </button>
        </div>
      </footer>

      {/* Sprite Zoom & Download Lightbox */}
      <SpriteLightboxModal
        isOpen={lightboxState.category !== null}
        category={lightboxState.category}
        spriteIndex={lightboxState.spriteIndex}
        lang={lang}
        currency={currency}
        usdRate={usdRate}
        onClose={handleCloseLightbox}
        onSelectIndex={(nextIdx) =>
          setLightboxState((prev) => ({ ...prev, spriteIndex: nextIdx }))
        }
      />

      {/* Non-intrusive Performance Suggestion When Animated Background Lags */}
      <AnimatePresence>
        {showLagPrompt && isBgEnabled && (
          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            role="status"
            aria-live="polite"
            className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[360px] z-50 rounded-2xl border-2 border-[var(--ui-border-strong)] bg-[var(--ui-card)]/95 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.75)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <p className="font-display text-sm sm:text-[15px] font-bold text-white leading-snug">
                  {lang === 'ru'
                    ? 'Сайт работает медленнее обычного?'
                    : 'Is the site feeling sluggish?'}
                </p>
                <p className="text-xs sm:text-[13px] text-[var(--ui-text)] leading-relaxed">
                  {lang === 'ru'
                    ? 'Можно отключить анимированный космический фон, чтобы прокрутка и интерфейс стали плавнее.'
                    : 'You can turn off the animated cosmic background for smoother scrolling and responsiveness.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowLagPrompt(false);
                  setLagPromptDismissed(true);
                }}
                aria-label={lang === 'ru' ? 'Закрыть' : 'Dismiss'}
                className="p-1 rounded-lg text-[var(--ui-text-muted)] hover:text-white hover:bg-[var(--ui-surface-alt)] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsBgEnabled(false);
                  setShowLagPrompt(false);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--ui-accent)]/40 bg-[var(--ui-btn-bg)] hover:bg-[var(--ui-btn-hover)] text-[var(--ui-btn-text)] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <EyeOff className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'ru' ? 'Отключить фон' : 'Disable background'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLagPrompt(false);
                  setLagPromptDismissed(true);
                }}
                className="px-3 py-2 rounded-xl border border-[var(--ui-border-strong)] bg-[var(--ui-surface-alt)] hover:bg-[var(--ui-card-hover)] text-[var(--ui-text)] hover:text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                {lang === 'ru' ? 'Оставить' : 'Keep'}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
