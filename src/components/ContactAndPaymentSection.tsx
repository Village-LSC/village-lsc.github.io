import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import {
  Language,
  PAYMENT_METHODS,
  SOCIAL_LINKS,
} from '../data/portfolioData';
import { SocialIcon } from './SocialIcons';

interface ContactAndPaymentSectionProps {
  lang: Language;
}

export function ContactAndPaymentSection({ lang }: ContactAndPaymentSectionProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

        {/* How to Pay (Card, SBP, Crypto, Boosty) */}
        <div
          data-nebula-light="true"
          className="rounded-2xl border-2 border-[var(--ui-border)] bg-[var(--ui-card)]/95 p-5 sm:p-7 space-y-5 shadow-[0_14px_40px_rgba(0,0,0,0.55)]"
        >
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#fbf7ff]">
            {lang === 'ru' ? 'Как можно оплатить' : 'Payment Methods'}
          </h2>

          <div className="divide-y divide-[var(--ui-border)]/70">
            {PAYMENT_METHODS.map((method) => (
              <div
                key={method.id}
                className="py-3.5 sm:py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4"
              >
                <div className="space-y-0.5">
                  <div className="text-base sm:text-[17px] font-bold text-white">
                    {lang === 'ru' ? method.titleRu : method.titleEn}
                  </div>
                  <p className="text-sm text-[var(--ui-text)]/85">
                    {lang === 'ru' ? method.subtitleRu : method.subtitleEn}
                  </p>
                </div>
                <span className="self-start sm:self-center font-mono text-xs font-semibold text-[var(--ui-accent-bright)] bg-[var(--ui-deep)] border border-[var(--ui-border-strong)] rounded-lg px-2.5 py-1 shrink-0 whitespace-nowrap tabular-nums">
                  {method.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
