import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, ExternalLink, CreditCard, Coins } from 'lucide-react';
import {
  Language,
  PAYMENT_METHODS,
  PaymentMethod,
  SOCIAL_LINKS,
} from '../data/portfolioData';
import { SocialIcon } from './SocialIcons';

interface ContactAndPaymentSectionProps {
  lang: Language;
}

export function ContactAndPaymentSection({ lang }: ContactAndPaymentSectionProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activePaymentId, setActivePaymentId] = useState<PaymentMethod['id']>('card-sbp');
  const activePayment =
    PAYMENT_METHODS.find((method) => method.id === activePaymentId) ?? PAYMENT_METHODS[0];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  return (
    <section
      id="contacts-payment"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16 sm:pb-20 relative z-10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-7 items-start">
        {/* Where to Message */}
        <div
          data-nebula-light="true"
          className="rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-card)]/95 p-5 sm:p-7 space-y-5 shadow-[0_14px_40px_rgba(0,0,0,0.55)]"
        >
          <div className="space-y-2">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#fbf7ff]">
              {lang === 'ru' ? 'Куда написать' : 'Contacts'}
            </h2>
            <p className="text-sm sm:text-base text-[var(--ui-text)]/85 leading-relaxed">
              {lang === 'ru' ? (
                <>
                  Чтобы сделать заказ, напишите мне в любую удобную соцсеть —{' '}
                  <span className="font-semibold text-white">
                    опишите задачу, желаемые размеры и приложите референсы
                  </span>
                  .
                </>
              ) : (
                <>
                  To place a commission, message me on any platform below with{' '}
                  <span className="font-semibold text-white">
                    your task description, target pixel sizes, and references
                  </span>
                  .
                </>
              )}
            </p>
          </div>

          <div className="divide-y divide-[var(--ui-border)]/70">
            {SOCIAL_LINKS.map((channel) => {
              const isCopied = copiedId === channel.id;
              return (
                <div
                  key={channel.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-3"
                >
                  <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--ui-deep)] border border-[var(--ui-border)] flex items-center justify-center text-[var(--ui-accent)] shrink-0 transition-colors duration-700">
                      <SocialIcon id={channel.id} className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white">
                        {channel.label}
                      </div>
                      <div className="font-mono text-xs sm:text-sm text-[var(--ui-accent-soft)] truncate select-all">
                        {channel.value}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    {channel.copyText && (
                      <button
                        type="button"
                        data-nebula-light="true"
                        onClick={() => handleCopy(channel.id, channel.copyText!)}
                        className="p-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-deep)] hover:border-[var(--ui-accent)] text-[var(--ui-text)] hover:text-white transition-colors cursor-pointer"
                        aria-label={lang === 'ru' ? 'Копировать' : 'Copy'}
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-[var(--ui-accent)]" />
                        )}
                      </button>
                    )}

                    {channel.href && (
                      <a
                        href={channel.href}
                        data-nebula-light="true"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg border border-[var(--ui-accent)]/35 bg-[var(--ui-btn-bg)] hover:bg-[var(--ui-btn-hover)] text-[var(--ui-btn-text)] text-xs font-semibold transition-colors whitespace-nowrap"
                      >
                        <span>{lang === 'ru' ? 'Открыть' : 'Open'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* How to Pay — Dynamic Interactive Payment Menu */}
        <div
          data-nebula-light="true"
          className="rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-card)]/95 p-5 sm:p-7 space-y-5 shadow-[0_14px_40px_rgba(0,0,0,0.55)]"
        >
          <div className="space-y-1.5">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#fbf7ff]">
              {lang === 'ru' ? 'Как можно оплатить' : 'Payment Methods'}
            </h2>
            <p className="text-sm sm:text-base text-[var(--ui-text)]/85 leading-relaxed">
              {lang === 'ru'
                ? 'Выберите способ оплаты, чтобы открыть ссылку или реквизиты.'
                : 'Select a payment method to view the payment link or wallet details.'}
            </p>
          </div>

          {/* Interactive Method Tabs */}
          <div
            role="tablist"
            aria-label={lang === 'ru' ? 'Способы оплаты' : 'Payment methods'}
            className="grid grid-cols-3 gap-1.5 p-1.5 rounded-xl border border-[var(--ui-border-strong)] bg-[var(--ui-deep)]/90"
          >
            {PAYMENT_METHODS.map((method) => {
              const isActive = method.id === activePayment.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActivePaymentId(method.id)}
                  className={`relative flex items-center justify-center gap-2 px-2.5 sm:px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none ${
                    isActive
                      ? 'text-white'
                      : 'text-[var(--ui-text)] hover:text-white hover:bg-[var(--ui-surface-alt)]/55'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activePaymentTabBg"
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0 rounded-lg bg-[var(--ui-card-hover)] border border-[var(--ui-accent)]/60 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {method.id === 'card-sbp' && (
                      <CreditCard className="w-4 h-4 text-[var(--ui-accent-bright)] shrink-0" />
                    )}
                    {method.id === 'crypto' && (
                      <Coins className="w-4 h-4 text-[var(--ui-accent-bright)] shrink-0" />
                    )}
                    {method.id === 'boosty' && (
                      <SocialIcon
                        id="boosty"
                        className="w-4 h-4 text-[var(--ui-accent-bright)] shrink-0"
                      />
                    )}
                    <span>{lang === 'ru' ? method.titleRu : method.titleEn}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Payment Method Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePayment.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-xl border border-[var(--ui-border-strong)] bg-[var(--ui-surface-alt)]/80 p-4 sm:p-5 space-y-4"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                    {lang === 'ru' ? activePayment.titleRu : activePayment.titleEn}
                  </h3>
                  <span className="font-mono text-xs font-medium text-[var(--ui-accent-soft)] shrink-0">
                    {lang === 'ru' ? activePayment.detailLabelRu : activePayment.detailLabelEn}
                  </span>
                </div>
                <p className="text-sm sm:text-[15px] text-[var(--ui-text)] leading-relaxed">
                  {lang === 'ru' ? activePayment.subtitleRu : activePayment.subtitleEn}
                </p>
              </div>

              <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-deep)]/95 px-3.5 py-3">
                <code className="block font-mono text-xs sm:text-sm text-[var(--ui-accent-soft)] break-all select-all leading-relaxed">
                  {activePayment.value}
                </code>
              </div>

              {activePayment.noteRu && (
                <p className="text-xs sm:text-sm text-[#f4d35e] font-medium">
                  {lang === 'ru' ? activePayment.noteRu : activePayment.noteEn}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {activePayment.href && (
                  <a
                    href={activePayment.href}
                    data-nebula-light="true"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--ui-accent)]/45 bg-[var(--ui-btn-bg)] hover:bg-[var(--ui-btn-hover)] text-[var(--ui-btn-text)] text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    <span>
                      {activePayment.id === 'card-sbp'
                        ? lang === 'ru'
                          ? 'Перейти к оплате'
                          : 'Proceed to payment'
                        : lang === 'ru'
                          ? 'Открыть Boosty'
                          : 'Open Boosty'}
                    </span>
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </a>
                )}

                <button
                  type="button"
                  data-nebula-light="true"
                  onClick={() => handleCopy(`pay-${activePayment.id}`, activePayment.copyText)}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activePayment.href
                      ? 'border-[var(--ui-border-strong)] bg-[var(--ui-deep)] hover:border-[var(--ui-accent)] text-white'
                      : 'border-[var(--ui-accent)]/45 bg-[var(--ui-btn-bg)] hover:bg-[var(--ui-btn-hover)] text-[var(--ui-btn-text)]'
                  }`}
                >
                  {copiedId === `pay-${activePayment.id}` ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{lang === 'ru' ? 'Скопировано' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[var(--ui-accent)] shrink-0" />
                      <span>
                        {activePayment.id === 'crypto'
                          ? lang === 'ru'
                            ? 'Скопировать адрес'
                            : 'Copy address'
                          : lang === 'ru'
                            ? 'Скопировать ссылку'
                            : 'Copy link'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
