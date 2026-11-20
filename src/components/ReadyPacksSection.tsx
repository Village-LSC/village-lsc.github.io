import React from 'react';
import { Package } from 'lucide-react';
import { Language } from '../data/portfolioData';

interface ReadyPacksSectionProps {
  lang: Language;
}

export function ReadyPacksSection({ lang }: ReadyPacksSectionProps) {
  return (
    <section
      id="ready-packs"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10"
    >
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#fbf7ff] tracking-tight mb-6">
        {lang === 'ru' ? 'Готовые паки' : 'Ready-Made Packs'}
      </h2>

      <div
        data-nebula-light="true"
        className="rounded-2xl border-2 border-dashed border-[var(--ui-border-strong)] bg-[var(--ui-surface-alt)]/92 px-6 py-12 flex flex-col items-center justify-center text-center gap-3 transition-colors duration-700"
      >
        <Package className="w-7 h-7 text-[var(--ui-accent)]" />
        <p className="font-display text-lg sm:text-xl font-semibold text-[#fbf7ff]">
          {lang === 'ru' ? 'Пока не опубликовано' : 'Not published yet'}
        </p>
      </div>
    </section>
  );
}
