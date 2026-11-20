import React, { useState } from 'react';
import { Check, X, Clock, Clipboard, Percent, Sparkles } from 'lucide-react';
import { Currency, Language } from '../data/portfolioData';
import { CURRENT_LOAD_STATUS } from '../loadStatus';

interface PricingAndTermsSectionProps {
  lang: Language;
  currency: Currency;
}

export function PricingAndTermsSection({ lang }: PricingAndTermsSectionProps) {
  const [attributionCopied, setAttributionCopied] = useState(false);

  const loadStatusMeta = {
    0: {
      labelRu: 'Статус загруженности: Свободен',
      labelEn: 'Queue Status: Open',
      dotClass: 'bg-emerald-400',
      colorClass: 'border-emerald-500/35 bg-emerald-950/30 text-emerald-200',
    },
    1: {
      labelRu: 'Статус загруженности: Средняя (+20% срочным)',
      labelEn: 'Queue Status: Moderate (+20% priority)',
      dotClass: 'bg-amber-400',
      colorClass: 'border-amber-400/35 bg-amber-950/30 text-amber-200',
    },
    2: {
      labelRu: 'Статус загруженности: Полный (только без дедлайна)',
      labelEn: 'Queue Status: Full (no-deadline only)',
      dotClass: 'bg-rose-400',
      colorClass: 'border-rose-400/35 bg-rose-950/30 text-rose-200',
    },
  }[CURRENT_LOAD_STATUS];

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
          { range: '51–100 шт.', discount: '45%' },
        ]
      : [
          { range: '11–30 pcs', discount: '15%' },
          { range: '31–50 pcs', discount: '25%' },
          { range: '51–100 pcs', discount: '45%' },
        ];

  const prepaymentTiers =
    lang === 'ru'
      ? [
          { range: 'До 10 000 ₽', percent: '50%' },
          { range: 'От 10 000 до 20 000 ₽', percent: '40%' },
          { range: 'От 20 000 до 30 000 ₽', percent: '30%' },
          { range: 'От 30 000 до 40 000 ₽', percent: '20%' },
          { range: 'От 40 000 до 50 000+ ₽', percent: '10%' },
        ]
      : [
          { range: 'Up to 10,000 ₽', percent: '50%' },
          { range: '10,000 to 20,000 ₽', percent: '40%' },
          { range: '20,000 to 30,000 ₽', percent: '30%' },
          { range: '30,000 to 40,000 ₽', percent: '20%' },
          { range: '40,000 to 50,000+ ₽', percent: '10%' },
        ];

  return (
    <section
      id="pricing-terms"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-12 sm:pb-16 relative z-10"
    >
      <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-[#fbf7ff] tracking-tight mb-6 sm:mb-8">
        {lang === 'ru' ? 'Цены и условия' : 'Pricing & Terms'}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-7 items-stretch">
        {/* LEFT COLUMN: Window 1 (Can / Cannot order) + Separate Window 2 (Turnaround) */}
        <div className="lg:col-span-6 flex flex-col gap-5 sm:gap-7">
          {/* Window 1: Allowed & Forbidden */}
          <div
            data-nebula-light="true"
            className="rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-card)]/95 p-5 sm:p-8 space-y-6 sm:space-y-7 shadow-[0_14px_40px_rgba(0,0,0,0.55)]"
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
          </div>

          {/* Window 2: Separate Turnaround Window */}
          <div
            data-nebula-light="true"
            className="rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-card)]/95 p-5 sm:p-8 space-y-4 shadow-[0_14px_40px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--ui-surface-alt)] border border-[var(--ui-border-strong)] flex items-center justify-center shrink-0">
                <Clock className="w-4.5 h-4.5 text-[var(--ui-accent)]" />
              </div>
              <h3 className="font-display text-lg sm:text-2xl font-bold text-white">
                {lang === 'ru' ? 'Сроки выполнения' : 'Turnaround Time'}
              </h3>
            </div>

            <p className="text-sm sm:text-[17px] text-[var(--ui-text)] leading-relaxed">
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

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--ui-border-strong)] border-l-4 border-l-[#e6c453] bg-[var(--ui-surface-alt)]/95 px-4 py-3">
              <span className="text-sm sm:text-base font-semibold text-white">
                {lang === 'ru' ? 'Минимальный срок работы' : 'Minimum execution time'}
              </span>
              <span className="font-mono text-lg sm:text-xl font-bold text-[#f4d35e] tabular-nums">
                {lang === 'ru' ? '7 дней' : '7 days'}
              </span>
            </div>

            <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-alt)]/65 px-4 py-3 text-sm sm:text-[15px] text-[var(--ui-text)] leading-relaxed">
              {lang === 'ru' ? (
                <>
                  В процессе работы доступны{' '}
                  <span className="font-semibold text-white">
                    бесплатные правки и показ этапов
                  </span>{' '}
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
                  <span className="font-semibold text-[#f4d35e]">10% compensation discount</span>{' '}
                  is provided in case of deadline delay.
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Price Factors, Discounts, Prepayment & Queue Status */}
        <div
          data-nebula-light="true"
          className="lg:col-span-6 rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-card)]/95 p-5 sm:p-8 flex flex-col justify-between gap-6 sm:gap-7 shadow-[0_14px_40px_rgba(0,0,0,0.55)]"
        >
          <div className="space-y-6 sm:space-y-7">
            {/* Queue Status */}
            <div className="pb-5 sm:pb-6 border-b border-[var(--ui-border)]">
              <div
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm sm:text-base font-bold leading-snug ${loadStatusMeta.colorClass}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${loadStatusMeta.dotClass}`} />
                <span>{lang === 'ru' ? loadStatusMeta.labelRu : loadStatusMeta.labelEn}</span>
              </div>
            </div>

            {/* How Pricing Is Calculated */}
            <div className="space-y-3.5 sm:space-y-4">
              <h3 className="font-display text-lg sm:text-2xl font-bold text-white">
                {lang === 'ru' ? 'Как рассчитывается цена' : 'How pricing is calculated'}
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm sm:text-[15px] text-[var(--ui-text-bright)] leading-snug">
                {priceFactors.map((item, idx) => (
                  <li
                    key={idx}
                    className={`flex items-center gap-2.5 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-alt)]/75 px-3.5 py-2.5 ${
                      idx === priceFactors.length - 1 && priceFactors.length % 2 === 1
                        ? 'sm:col-span-2'
                        : ''
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-[2px] bg-[var(--ui-accent)] shrink-0"
                      aria-hidden="true"
                    />
                    <span className="font-medium">{item}</span>
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
                <p className="text-xs sm:text-sm font-medium text-[var(--ui-accent-soft)]">
                  {lang === 'ru'
                    ? 'Чем выше сумма заказа, тем ниже процент'
                    : 'Higher order total, lower deposit'}
                </p>
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

          {/* Attribution Block */}
          <div className="pt-5 sm:pt-6 border-t border-[var(--ui-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ui-text-muted)]">
                {lang === 'ru' ? 'Указание авторства' : 'Attribution credit'}
              </div>
              <code className="block font-mono text-sm sm:text-base font-bold text-white select-all break-words">
                Sprite Artist: Village_
              </code>
            </div>
            <button
              type="button"
              data-nebula-light="true"
              onClick={handleCopyAttribution}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--ui-card-hover)] border border-[var(--ui-border-strong)] hover:border-[var(--ui-accent)] text-sm font-medium text-white transition-colors cursor-pointer shrink-0"
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
      </div>
    </section>
  );
}
