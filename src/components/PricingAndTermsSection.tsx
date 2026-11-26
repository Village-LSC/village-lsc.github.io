import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Clock, Clipboard, Percent, Sparkles, ChevronDown } from 'lucide-react';
import { Currency, DEFAULT_USD_RATE, Language } from '../data/portfolioData';
import { CURRENT_LOAD_STATUS } from '../loadStatus';

interface PricingAndTermsSectionProps {
  lang: Language;
  currency: Currency;
  usdRate?: number;
}

export function PricingAndTermsSection({
  lang,
  currency,
  usdRate = DEFAULT_USD_RATE,
}: PricingAndTermsSectionProps) {
  const [attributionCopied, setAttributionCopied] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isStatusOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setIsStatusOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsStatusOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isStatusOpen]);

  const loadStatuses = [
    {
      id: 0 as const,
      labelRu: 'Свободно',
      labelEn: 'Open',
      descRu: 'Все заказы выполняются в обычном порядке.',
      descEn: 'All orders are fulfilled on the regular schedule.',
      dotClass: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]',
      textClass: 'text-emerald-300',
      activeBgClass: 'bg-emerald-950/30',
    },
    {
      id: 1 as const,
      labelRu: 'Слабо загружено',
      labelEn: 'Light load',
      descRu: 'Заказы задержатся на 2 недели.',
      descEn: 'Orders will be delayed by ~2 weeks.',
      dotClass: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]',
      textClass: 'text-amber-300',
      activeBgClass: 'bg-amber-950/30',
    },
    {
      id: 2 as const,
      labelRu: 'Загружено',
      labelEn: 'Busy',
      descRu: 'Заказы могут задерживаться на месяц и более.',
      descEn: 'Orders may be delayed by a month or more.',
      dotClass: 'bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.7)]',
      textClass: 'text-orange-300',
      activeBgClass: 'bg-orange-950/30',
    },
    {
      id: 3 as const,
      labelRu: 'Закрыты',
      labelEn: 'Closed',
      descRu: 'Заказы не принимаются в ближайшее время.',
      descEn: 'Orders are not being accepted in the near future.',
      dotClass: 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.7)]',
      textClass: 'text-rose-300',
      activeBgClass: 'bg-rose-950/30',
    },
  ];

  const activeLoadStatus =
    loadStatuses.find((s) => s.id === CURRENT_LOAD_STATUS) ?? loadStatuses[1];

  const handleCopyAttribution = () => {
    navigator.clipboard.writeText('Sprite Artist: Village_');
    setAttributionCopied(true);
    window.setTimeout(() => setAttributionCopied(false), 2000);
  };

  const allowedList =
    lang === 'ru'
      ? [
          'Все представленные выше категории',
          'Анимации для любых категорий, кроме 3D-моделей и скинов',
          'Спрайты в любом стиле и разрешении',
          'Нестандартные задачи обсуждаются отдельно за дополнительную плату',
        ]
      : [
          'All presented categories',
          'Animations for any category except 3D models and skins',
          'Any sprite in any style and format',
          'Custom non-standard tasks can be discussed for an additional fee',
        ];

  const forbiddenList =
    lang === 'ru'
      ? [
          'Кровь в жестоком формате',
          'Насилие',
          'Военная тематика',
          'Слишком сложные спрайты за дёшево',
          'Непиксельные работы',
        ]
      : [
          'Brutal gore / blood',
          'Violence',
          'Military themes',
          'Overly complex sprites for cheap',
          'Non-pixel artwork',
        ];

  const priceFactors =
    lang === 'ru'
      ? [
          'Уровень проработки и качество',
          'Уникальный дизайн',
          'Дополнительные вариации',
          'Анимация',
          'Увеличенное разрешение и детализация',
        ]
      : [
          'Higher work quality',
          'Unique custom design',
          'Variations',
          'Animation',
          'Larger resolution with higher detail quality',
        ];

  const bulkTiers =
    lang === 'ru'
      ? [
          { range: '11–30 шт.', discount: '15%' },
          { range: '31–50 шт.', discount: '25%' },
          { range: '51–100 шт.', discount: '35%' },
        ]
      : [
          { range: '11–30 pcs', discount: '15%' },
          { range: '31–50 pcs', discount: '25%' },
          { range: '51–100 pcs', discount: '35%' },
        ];

  const prepaymentTiers = useMemo(() => {
    const rawTiers = [
      { minRub: 0, maxRub: 10000, percent: '50%' },
      { minRub: 10000, maxRub: 20000, percent: '40%' },
      { minRub: 20000, maxRub: 30000, percent: '30%' },
      { minRub: 30000, maxRub: 40000, percent: '20%' },
      { minRub: 40000, maxRub: 50000, isMaxPlus: true, percent: '10%' },
    ];

    return rawTiers.map((tier) => {
      let rangeText: string;
      if (currency === 'rub') {
        const fmt = (n: number) => n.toLocaleString('ru-RU');
        if (tier.minRub === 0) {
          rangeText = lang === 'ru' ? `До ${fmt(tier.maxRub)} ₽` : `Up to ${fmt(tier.maxRub)} ₽`;
        } else if (tier.isMaxPlus) {
          rangeText =
            lang === 'ru'
              ? `От ${fmt(tier.minRub)} до ${fmt(tier.maxRub)}+ ₽`
              : `${fmt(tier.minRub)} to ${fmt(tier.maxRub)}+ ₽`;
        } else {
          rangeText =
            lang === 'ru'
              ? `От ${fmt(tier.minRub)} до ${fmt(tier.maxRub)} ₽`
              : `${fmt(tier.minRub)} to ${fmt(tier.maxRub)} ₽`;
        }
      } else {
        const toUsd = (rub: number) => Math.round(rub / usdRate / 10) * 10;
        const lowUsd = toUsd(tier.minRub);
        const highUsd = toUsd(tier.maxRub);
        if (tier.minRub === 0) {
          rangeText = lang === 'ru' ? `До $${highUsd}` : `Up to $${highUsd}`;
        } else if (tier.isMaxPlus) {
          rangeText =
            lang === 'ru'
              ? `От $${lowUsd} до $${highUsd}+`
              : `$${lowUsd} to $${highUsd}+`;
        } else {
          rangeText =
            lang === 'ru'
              ? `От $${lowUsd} до $${highUsd}`
              : `$${lowUsd} to $${highUsd}`;
        }
      }
      return { range: rangeText, percent: tier.percent };
    });
  }, [currency, lang, usdRate]);

  return (
    <section
      id="pricing-terms"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-12 sm:pb-16 relative z-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8 relative z-30">
        <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-[#fbf7ff] tracking-tight">
          {lang === 'ru' ? 'Цены и условия' : 'Pricing & Terms'}
        </h2>

        {/* Standalone Expandable Order Status Dropdown (Borderless, Simple) */}
        <div ref={statusMenuRef} className="relative self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsStatusOpen((prev) => !prev)}
            aria-expanded={isStatusOpen}
            aria-haspopup="true"
            className="group inline-flex items-center gap-3.5 sm:gap-4 py-1 text-left cursor-pointer focus-visible:outline-none"
          >
            <span
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-110 ${activeLoadStatus.dotClass}`}
            />
            <span className="font-display text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-[#fbf7ff] leading-tight whitespace-nowrap">
              {lang === 'ru' ? 'Статус заказов:' : 'Order status:'}{' '}
              <span className={activeLoadStatus.textClass}>
                {lang === 'ru' ? activeLoadStatus.labelRu : activeLoadStatus.labelEn}
              </span>
            </span>
            <ChevronDown
              className={`w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5] shrink-0 text-[var(--ui-accent-bright)] group-hover:text-white transition-all duration-200 ml-0.5 ${
                isStatusOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {isStatusOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-0 md:left-auto md:right-0 mt-3 w-[min(92vw,420px)] rounded-2xl border-2 border-[var(--ui-border-strong)] bg-[var(--ui-card)]/98 backdrop-blur-md shadow-[0_24px_60px_rgba(0,0,0,0.85)] overflow-hidden z-50"
              >
                <div className="divide-y divide-[var(--ui-border)]/70">
                  {loadStatuses.map((status) => {
                    const isActive = status.id === CURRENT_LOAD_STATUS;
                    return (
                      <div
                        key={status.id}
                        className={`px-4 py-3.5 transition-colors ${
                          isActive ? status.activeBgClass : 'bg-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${status.dotClass}`}
                          />
                          <span
                            className={`font-display text-base sm:text-[18px] font-bold tracking-tight ${
                              isActive ? status.textClass : 'text-white'
                            }`}
                          >
                            {lang === 'ru' ? status.labelRu : status.labelEn}
                          </span>
                        </div>
                        <p className="mt-1 pl-5 text-sm sm:text-[15px] text-[var(--ui-text-bright)]/90 leading-relaxed">
                          {lang === 'ru' ? status.descRu : status.descEn}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-7 items-stretch">
        {/* LEFT COLUMN: Allowed, Forbidden & Instructions */}
        <div
          data-nebula-light="true"
          className="lg:col-span-6 rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-card)]/95 p-5 sm:p-8 space-y-6 sm:space-y-7 shadow-[0_14px_40px_rgba(0,0,0,0.55)]"
        >
            <div className="space-y-3.5 sm:space-y-4">
              <h3 className="font-display text-lg sm:text-2xl font-bold text-white">
                {lang === 'ru' ? 'Что можно заказать' : 'What you can order'}
              </h3>
              <ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-[17px] text-[var(--ui-text-bright)] leading-relaxed">
                {allowedList.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="mt-0.5 w-6 h-6 rounded-lg bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </span>
                    <span className="pt-0.5">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-5 sm:pt-6 border-t border-[var(--ui-border)] space-y-3.5 sm:space-y-4">
              <h3 className="font-display text-lg sm:text-2xl font-bold text-rose-200">
                {lang === 'ru' ? 'Что нельзя заказывать' : 'What cannot be ordered'}
              </h3>
              <ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-[17px] text-[var(--ui-text)] leading-relaxed">
                {forbiddenList.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="mt-0.5 w-6 h-6 rounded-lg bg-rose-500/12 border border-rose-500/25 flex items-center justify-center shrink-0">
                      <X className="w-3.5 h-3.5 text-rose-400" />
                    </span>
                    <span className="pt-0.5">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-5 sm:pt-6 border-t border-[var(--ui-border)] space-y-4">
              <h3 className="font-display text-lg sm:text-2xl font-bold text-white">
                {lang === 'ru' ? 'Инструкции' : 'Instructions'}
              </h3>

              <ol className="divide-y divide-[var(--ui-border)]/70">
                <li className="pb-4 flex items-start gap-3.5">
                  <span className="mt-0.5 font-mono text-sm font-bold text-[var(--ui-accent-bright)] tabular-nums shrink-0 w-6">
                    01
                  </span>
                  <div className="space-y-1 min-w-0">
                    <div className="font-display text-base sm:text-[17px] font-bold text-white leading-snug">
                      {lang === 'ru' ? 'Подробное ТЗ и референс' : 'Detailed brief & reference'}
                    </div>
                    <p className="text-sm sm:text-[16px] text-[var(--ui-text-bright)]/90 leading-relaxed">
                      {lang === 'ru'
                        ? 'Перед отправкой заказа лучше расписать подробное ТЗ с тем, что нужно выполнить, и по возможности отправить референс.'
                        : 'Before sending an order, write a detailed brief describing what needs to be done and attach a reference if possible.'}
                    </p>
                  </div>
                </li>

                <li className="py-4 flex items-start gap-3.5">
                  <span className="mt-0.5 font-mono text-sm font-bold text-[var(--ui-accent-bright)] tabular-nums shrink-0 w-6">
                    02
                  </span>
                  <div className="space-y-2.5 min-w-0 flex-1">
                    <div className="space-y-1">
                      <div className="font-display text-base sm:text-[17px] font-bold text-white leading-snug">
                        {lang === 'ru' ? 'Указание авторства' : 'Artist attribution'}
                      </div>
                      <p className="text-sm sm:text-[16px] text-[var(--ui-text-bright)]/90 leading-relaxed">
                        {lang === 'ru'
                          ? 'Укажите где-нибудь в проекте или описании, что арты были нарисованы мной:'
                          : 'Mention somewhere in your project or description that the artwork was drawn by me:'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[var(--ui-border-strong)] bg-[var(--ui-surface-alt)]/85 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <code className="font-mono text-sm sm:text-[15px] font-bold text-white select-all break-words">
                        Sprite Artist: Village_
                      </code>
                      <button
                        type="button"
                        data-nebula-light="true"
                        onClick={handleCopyAttribution}
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--ui-card-hover)] border border-[var(--ui-border-strong)] hover:border-[var(--ui-accent)] text-xs sm:text-sm font-medium text-white transition-colors cursor-pointer shrink-0"
                      >
                        {attributionCopied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>{lang === 'ru' ? 'Скопировано' : 'Copied'}</span>
                          </>
                        ) : (
                          <>
                            <Clipboard className="w-4 h-4 text-[var(--ui-accent)]" />
                            <span>{lang === 'ru' ? 'Скопировать' : 'Copy'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </li>

                <li className="pt-4 flex items-start gap-3.5">
                  <span className="mt-0.5 font-mono text-sm font-bold text-[#f4d35e] tabular-nums shrink-0 w-6">
                    03
                  </span>
                  <div className="space-y-1 min-w-0">
                    <div className="font-display text-base sm:text-[17px] font-bold text-white leading-snug">
                      {lang === 'ru' ? 'Без указания авторства' : 'Waiving attribution'}
                    </div>
                    <p className="text-sm sm:text-[16px] text-[var(--ui-text-bright)]/90 leading-relaxed">
                      {lang === 'ru' ? (
                        <>
                          Если вы не хотите добавлять упоминание авторства, можно доплатить{' '}
                          <span className="font-semibold text-[#f4d35e]">10% сверху</span> к
                          стоимости заказа.
                        </>
                      ) : (
                        <>
                          If you prefer not to include attribution, you can pay{' '}
                          <span className="font-semibold text-[#f4d35e]">10% extra</span> on top of
                          the order total.
                        </>
                      )}
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

        {/* RIGHT COLUMN: Price Factors, Discounts & Prepayment */}
        <div
          data-nebula-light="true"
          className="lg:col-span-6 rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-card)]/95 p-5 sm:p-8 flex flex-col gap-6 sm:gap-7 shadow-[0_14px_40px_rgba(0,0,0,0.55)]"
        >
          <div className="space-y-6 sm:space-y-7">
            {/* How Pricing Is Calculated */}
            <div className="space-y-4">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white text-left">
                {lang === 'ru' ? 'Как рассчитывается цена' : 'How pricing is calculated'}
              </h3>
              <ul className="flex flex-col items-start space-y-3 sm:space-y-3.5 text-base sm:text-[18px] text-[var(--ui-text-bright)] leading-relaxed text-left">
                {priceFactors.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3.5 w-full">
                    <span
                      className="mt-0.5 w-7 h-7 rounded-lg bg-[var(--ui-surface-alt)] border border-[var(--ui-border-strong)] flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--ui-accent)]" />
                    </span>
                    <span className="font-medium pt-0.5">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Discounts */}
            <div className="pt-5 sm:pt-6 border-t border-[var(--ui-border)] space-y-4">
              <h3 className="font-display text-lg sm:text-2xl font-bold text-white">
                {lang === 'ru' ? 'Скидки и предоплата' : 'Discounts & Prepayment'}
              </h3>

              <div className="space-y-3">
                {/* Bulk Discount Card */}
                <div className="rounded-xl border border-[var(--ui-border-strong)] bg-[var(--ui-surface-alt)]/85 p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Percent className="w-4 h-4 text-[#f4d35e] shrink-0" />
                    <span className="text-sm sm:text-base font-bold text-white">
                      {lang === 'ru'
                        ? 'Оптовая скидка за большой заказ'
                        : 'Bulk discount on large orders'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {bulkTiers.map((tier) => (
                      <div
                        key={tier.range}
                        className="rounded-lg border border-[var(--ui-border-strong)] bg-[var(--ui-deep)]/95 px-2 py-2.5 text-center"
                      >
                        <div className="font-mono text-[11px] sm:text-xs font-medium text-[var(--ui-text)]">
                          {tier.range}
                        </div>
                        <div className="font-mono text-base sm:text-xl font-bold text-[#f4d35e] tabular-nums mt-0.5">
                          {tier.discount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Long-Term Discount Card */}
                <div className="rounded-xl border border-[var(--ui-border-strong)] bg-[var(--ui-surface-alt)]/85 px-3.5 sm:px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Sparkles className="w-4 h-4 text-[#f4d35e] shrink-0" />
                    <span className="text-sm sm:text-[15px] font-semibold text-white leading-snug">
                      {lang === 'ru'
                        ? 'Долгосрочное сотрудничество (на все следующие заказы)'
                        : 'Long-term collaboration (all subsequent orders)'}
                    </span>
                  </div>
                  <span className="font-mono text-base sm:text-xl font-bold text-[#f4d35e] shrink-0 tabular-nums">
                    10%
                  </span>
                </div>
              </div>
            </div>

            {/* Prepayment */}
            <div className="pt-5 sm:pt-6 border-t border-[var(--ui-border)] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <h4 className="font-display text-base sm:text-xl font-bold text-white">
                  {lang === 'ru' ? 'Предоплата' : 'Prepayment'}
                </h4>
                <div className="flex flex-col sm:items-end text-xs sm:text-sm">
                  <span className="font-medium text-[var(--ui-accent-soft)]">
                    {lang === 'ru'
                      ? 'Чем выше сумма заказа, тем ниже процент'
                      : 'Higher order total, lower deposit'}
                  </span>
                  {currency === 'usd' && (
                    <span className="text-[11px] font-mono text-[#f4d35e] mt-0.5">
                      {lang === 'ru'
                        ? `Курс пересчёта: 1 $ ≈ ${Math.round(usdRate)} ₽`
                        : `Exchange rate: $1 ≈ ${Math.round(usdRate)} ₽`}
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[var(--ui-border-strong)] bg-[var(--ui-surface-alt)]/85 divide-y divide-[var(--ui-border)]/70 overflow-hidden">
                {prepaymentTiers.map((tier, idx) => (
                  <div
                    key={idx}
                    className="px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-4 text-sm sm:text-[15px]"
                  >
                    <span className="font-medium text-[var(--ui-text-bright)]">{tier.range}</span>
                    <span className="font-mono text-base font-bold text-white tabular-nums shrink-0">
                      {tier.percent}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULL-WIDTH TURNAROUND STRIP */}
      <div
        data-nebula-light="true"
        className="mt-5 sm:mt-7 rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-card)]/95 p-5 sm:p-7 shadow-[0_14px_40px_rgba(0,0,0,0.55)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-center">
          <div className="lg:col-span-4 space-y-1.5">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--ui-surface-alt)] border border-[var(--ui-border-strong)] flex items-center justify-center shrink-0">
                <Clock className="w-4.5 h-4.5 text-[var(--ui-accent)]" />
              </div>
              <h3 className="font-display text-lg sm:text-2xl font-bold text-white">
                {lang === 'ru' ? 'Сроки выполнения' : 'Turnaround Time'}
              </h3>
            </div>
            <p className="text-sm sm:text-[16px] text-[var(--ui-text)] leading-relaxed">
              {lang === 'ru' ? (
                <>
                  Срок определяется{' '}
                  <span className="font-semibold text-white">строго индивидуально</span> под объём
                  заказа.
                </>
              ) : (
                <>
                  Turnaround is determined{' '}
                  <span className="font-semibold text-white">strictly individually</span> based on
                  order volume.
                </>
              )}
            </p>
          </div>

          <div className="lg:col-span-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e6c453]/35 bg-[#e6c453]/8 px-4 py-3.5">
            <span className="text-sm sm:text-base font-semibold text-white">
              {lang === 'ru' ? 'Минимальный срок' : 'Minimum time'}
            </span>
            <span className="font-mono text-lg sm:text-xl font-bold text-[#f4d35e] tabular-nums">
              {lang === 'ru' ? '7 дней' : '7 days'}
            </span>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-alt)]/65 px-4 py-3.5 text-sm sm:text-[15px] text-[var(--ui-text)] leading-relaxed">
            {lang === 'ru' ? (
              <>
                В процессе работы доступны{' '}
                <span className="font-semibold text-white">бесплатные правки и показ этапов</span>{' '}
                по желанию. При задержке сдачи даётся{' '}
                <span className="font-semibold text-[#f4d35e]">
                  компенсация 10% от суммы заказа
                </span>
                .
              </>
            ) : (
              <>
                <span className="font-semibold text-white">
                  Free WIP revisions and milestone previews
                </span>{' '}
                are available on request. A{' '}
                <span className="font-semibold text-[#f4d35e]">10% compensation discount</span> is
                provided in case of deadline delay.
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
