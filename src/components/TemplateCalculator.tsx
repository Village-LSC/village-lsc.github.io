import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sword,
  User,
  Layers,
  Flame,
  Layout,
  Sparkles,
  Box,
  Image as ImageIcon,
  Check,
  Plus,
  Minus,
  ArrowRight,
  Sliders,
  Clock,
  ChevronDown,
  ChevronUp,
  Package,
  Trash2,
  Filter,
  X
} from 'lucide-react';
import { CALCULATOR_TEMPLATES, CalculatorTemplate } from '../data/templates';
import { ComplexitySelection } from './ComplexitySelection';
import { PriceRange, TemplateItemState, CATEGORIES_LIST } from '../types';

interface TemplateCalculatorProps {
  items: TemplateItemState[];
  onAddItem: () => void;
  onRemoveItem: (id: number) => void;
  onUpdateItem: <K extends keyof TemplateItemState>(
    id: number,
    field: K,
    value: TemplateItemState[K]
  ) => void;
  onConvertToGranular: () => void;
  getItemPrice: (item: TemplateItemState) => { totalPrice: number; priceRange?: PriceRange };
  lang: 'ru' | 'en';
  formatPrice: (p: number | PriceRange) => string;
  addAssetBtnText: string;
}

export function TemplateCalculator({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onConvertToGranular,
  getItemPrice,
  lang,
  formatPrice,
  addAssetBtnText,
}: TemplateCalculatorProps) {
  // Track open template selector menus per item id
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Category filter state for template selector menu
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);

  // Pre-calculate counts of templates per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: CALCULATOR_TEMPLATES.length };
    CATEGORIES_LIST.forEach((cat) => {
      counts[cat.id] = CALCULATOR_TEMPLATES.filter((t) => t.categoryId === cat.id).length;
    });
    return counts;
  }, []);

  // Track collapsed/expanded state of cards
  const [expandedCards, setExpandedCards] = useState<{ [key: number]: boolean }>({
    [items[0]?.id || 1]: true,
  });

  const toggleCard = (id: number) => {
    setExpandedCards((prev) => ({ ...prev, [id]: prev[id] === false ? true : false }));
  };

  const getTemplateIcon = (iconName?: string, className: string = 'w-5 h-5') => {
    switch (iconName) {
      case 'sword':
        return <Sword className={className} />;
      case 'user':
        return <User className={className} />;
      case 'layers':
        return <Layers className={className} />;
      case 'flame':
        return <Flame className={className} />;
      case 'layout':
        return <Layout className={className} />;
      case 'box':
        return <Box className={className} />;
      case 'image':
        return <ImageIcon className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* List of Template Asset Cards */}
      <div className="space-y-6">
        <AnimatePresence initial={false}>
          {items.map((item, idx) => {
            const selectedTemplate =
              CALCULATOR_TEMPLATES.find((t) => t.id === item.templateId) ||
              CALCULATOR_TEMPLATES[0];

            const itemPriceInfo = getItemPrice(item);
            const isExpanded = expandedCards[item.id] !== false;
            const isMenuOpen = openMenuId === item.id;

            // Map quality to ComplexitySelection
            const detailLevel: 'simple' | 'moderate' | 'detailed' =
              item.quality === 'best'
                ? 'detailed'
                : item.quality === 'medium'
                ? 'moderate'
                : 'simple';

            const handleComplexityChange = (val: 'simple' | 'moderate' | 'detailed') => {
              const mapped = val === 'detailed' ? 'best' : val === 'moderate' ? 'medium' : 'optimal';
              onUpdateItem(item.id, 'quality', mapped);
            };

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-[#2d143f] border-4 border-[#140620] rounded-2xl p-5 sm:p-6 shadow-xl hover:border-purple-300 hover:shadow-[0_0_25px_rgba(192,132,252,0.15)] transition-all duration-300 relative overflow-hidden group"
              >
                {/* Inner highlight border */}
                <div className="absolute inset-1 border border-[#ebd6f7]/5 rounded-xl pointer-events-none"></div>

                {/* Card Header matching granular card structure */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#ebd6f7]/10 pb-4 mb-5 relative z-10 select-none">
                  <div
                    onClick={() => toggleCard(item.id)}
                    className="flex flex-wrap items-center gap-2.5 flex-1 cursor-pointer group/header"
                  >
                    {/* Collapse Toggle Icon */}
                    <div className="w-8 h-8 rounded-lg bg-[#12051d] hover:bg-purple-950 border border-[#3d1a56] flex items-center justify-center text-purple-300 transition-colors">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>

                    <span className="font-mono text-sm sm:text-base font-bold bg-[#12051d] text-purple-300 px-2.5 py-1 rounded-lg border-2 border-[#3d1a56] shadow-inner group-hover/header:border-purple-400/50 transition-colors">
                      {lang === 'ru' ? `ШАБЛОН #${idx + 1}` : `TEMPLATE #${idx + 1}`}
                    </span>

                    <span className="text-base font-bold text-purple-100 tracking-tight group-hover/header:text-purple-300 transition-colors">
                      {lang === 'ru' ? selectedTemplate.titleRu : selectedTemplate.titleEn}
                    </span>

                    {/* Summary Badge */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-purple-200/80 font-semibold bg-[#12051d]/40 px-2.5 py-1 rounded-lg border border-[#3d1a56]/50">
                      <span>
                        {selectedTemplate.defaultWidth}×{selectedTemplate.defaultHeight} px
                      </span>
                      <span className="opacity-40">•</span>
                      <span>
                        {item.count} {lang === 'ru' ? 'шт.' : 'pcs'}
                      </span>
                      <span className="opacity-40">•</span>
                      <span>
                        {item.hasAnimation
                          ? lang === 'ru'
                            ? `Анимация (${item.animDuration} с.)`
                            : `Anim (${item.animDuration}s)`
                          : lang === 'ru'
                          ? 'Статичный'
                          : 'Static'}
                      </span>
                      {item.taskDesc.trim() && (
                        <>
                          <span className="opacity-40">•</span>
                          <span className="text-purple-300/70 italic max-w-[180px] truncate">
                            "{item.taskDesc}"
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Header controls (price and delete button) */}
                  <div className="flex items-center gap-3">
                    <div className="text-xs sm:text-sm font-bold text-[#f7f5ef] bg-[#12051d] px-3.5 py-1.5 rounded-xl border border-purple-500/20 shadow-inner font-mono">
                      <span className="text-purple-300 font-extrabold">
                        {itemPriceInfo.priceRange &&
                        itemPriceInfo.priceRange.low !== itemPriceInfo.priceRange.high
                          ? `${formatPrice(itemPriceInfo.priceRange.low)} – ${formatPrice(
                              itemPriceInfo.priceRange.high
                            )}`
                          : formatPrice(itemPriceInfo.totalPrice)}
                      </span>
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="flex items-center gap-1.5 text-sm font-bold text-red-300 hover:text-red-200 bg-[#3a0c14] hover:bg-[#521320] border-2 border-[#140620] px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{lang === 'ru' ? 'Удалить' : 'Delete'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Card Body */}
                {isExpanded && (
                  <div className="space-y-5 relative z-10">
                    {/* 1. Collapsible Template Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-bold uppercase tracking-wider text-[#ebd6f7]/70 flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-purple-400" />
                          <span>{lang === 'ru' ? 'Выбор шаблона' : 'Template Selection'}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(isMenuOpen ? null : item.id)}
                          className="text-xs font-mono font-bold text-purple-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>
                            {isMenuOpen
                              ? lang === 'ru'
                                ? 'Свернуть меню'
                                : 'Collapse menu'
                              : lang === 'ru'
                              ? 'Сменить шаблон'
                              : 'Change template'}
                          </span>
                          {isMenuOpen ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Trigger Bar (Collapsed by default) */}
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(isMenuOpen ? null : item.id)}
                        className={`w-full bg-[#12051d] hover:bg-[#1a0729] p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer text-left flex items-center justify-between gap-3 shadow-inner ${
                          isMenuOpen
                            ? 'border-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.25)]'
                            : 'border-[#3d1a56] hover:border-purple-400/60'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 pr-2">
                          {/* Square Thumbnail Preview */}
                          <div className="w-12 h-12 rounded-xl bg-[#2a2a32] border border-[#4d4d5a] flex items-center justify-center shrink-0 overflow-hidden relative shadow-inner">
                            {selectedTemplate.image ? (
                              <img
                                src={selectedTemplate.image}
                                alt={selectedTemplate.titleRu}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-[#2d2d35] text-[#888899]">
                                {getTemplateIcon(selectedTemplate.iconName, 'w-5 h-5')}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm sm:text-base text-white truncate">
                                {lang === 'ru' ? selectedTemplate.titleRu : selectedTemplate.titleEn}
                              </span>
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/30 text-purple-300 shrink-0 hidden sm:inline-block">
                                {lang === 'ru' ? selectedTemplate.badgeRu : selectedTemplate.badgeEn}
                              </span>
                            </div>
                            <p className="text-xs text-[#ebd6f7]/60 truncate max-w-xl">
                              {lang === 'ru' ? selectedTemplate.descRu : selectedTemplate.descEn}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/30 hidden md:inline-block">
                            {lang === 'ru'
                              ? selectedTemplate.approxPriceRangeRu
                              : selectedTemplate.approxPriceRangeEn}
                          </span>
                          <div className="w-8 h-8 rounded-lg bg-[#1c082c] border border-[#3d1a56] flex items-center justify-center text-purple-300">
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${
                                isMenuOpen ? 'rotate-180 text-purple-200' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </button>

                      {/* Expandable Template Selection Grid with Centered Images */}
                      <AnimatePresence>
                        {isMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, y: -8 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -8 }}
                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                            className="overflow-hidden mt-2.5 z-30"
                          >
                            <div className="bg-[#12051d] p-3 sm:p-5 rounded-2xl border-2 border-purple-400/50 shadow-[0_12px_35px_rgba(0,0,0,0.7)] space-y-4">
                              <div className="flex items-center justify-between text-xs text-stone-400 pb-2 border-b border-[#3d1a56]/80 px-1">
                                <span className="font-mono uppercase font-bold text-purple-300">
                                  {lang === 'ru'
                                    ? 'Выберите подходящий шаблон:'
                                    : 'Select a template:'}
                                </span>
                                <span className="text-[11px] text-[#ebd6f7]/60">
                                  {lang === 'ru'
                                    ? 'Нажмите на карточку для выбора'
                                    : 'Click card to select'}
                                </span>
                              </div>

                              {/* Configurable Category Filter Block */}
                              <div className="bg-[#180727] p-3 rounded-xl border border-[#3d1a56] space-y-2.5">
                                <div className="flex flex-wrap items-center justify-between gap-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-purple-300">
                                      <Filter className="w-3.5 h-3.5 text-purple-400" />
                                      <span>{lang === 'ru' ? 'Фильтр категорий:' : 'Category Filter:'}</span>
                                    </div>

                                    {/* Button to show/configure categories */}
                                    <button
                                      type="button"
                                      onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                                        isCategoryDropdownOpen
                                          ? 'bg-purple-600 text-white border-purple-300 ring-2 ring-purple-400/40'
                                          : categoryFilter !== 'all'
                                          ? 'bg-purple-700/40 hover:bg-purple-700/60 text-purple-100 border-purple-400'
                                          : 'bg-[#230c37] hover:bg-[#2f104a] text-stone-200 border-[#4d236b]'
                                      }`}
                                    >
                                      <span>
                                        {categoryFilter === 'all'
                                          ? (lang === 'ru' ? `Все категории (${CALCULATOR_TEMPLATES.length})` : `All categories (${CALCULATOR_TEMPLATES.length})`)
                                          : (() => {
                                              const activeCat = CATEGORIES_LIST.find((c) => c.id === categoryFilter);
                                              return activeCat
                                                ? `${activeCat.id}. ${lang === 'ru' ? activeCat.nameRu : activeCat.nameEn} (${categoryCounts[categoryFilter] || 0})`
                                                : categoryFilter;
                                            })()}
                                      </span>
                                      <ChevronDown
                                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                          isCategoryDropdownOpen ? 'rotate-180 text-white' : 'text-purple-300'
                                        }`}
                                      />
                                    </button>

                                    {/* Reset filter button when a specific category is active */}
                                    {categoryFilter !== 'all' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCategoryFilter('all');
                                          setIsCategoryDropdownOpen(false);
                                        }}
                                        className="px-2 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/70 border border-red-500/50 text-red-200 text-xs font-mono transition-all flex items-center gap-1 cursor-pointer"
                                        title={lang === 'ru' ? 'Сбросить фильтр на все категории' : 'Reset filter to all categories'}
                                      >
                                        <X className="w-3 h-3" />
                                        <span>{lang === 'ru' ? 'Все' : 'All'}</span>
                                      </button>
                                    )}
                                  </div>

                                  <div className="text-[11px] font-mono text-purple-300/70 flex items-center gap-1">
                                    <span>{lang === 'ru' ? 'Найдено шаблонов:' : 'Found templates:'}</span>
                                    <span className="font-bold text-white px-1.5 py-0.5 rounded bg-purple-900/50 border border-purple-500/30">
                                      {CALCULATOR_TEMPLATES.filter(
                                        (tmpl) => categoryFilter === 'all' || tmpl.categoryId === categoryFilter
                                      ).length}
                                    </span>
                                  </div>
                                </div>

                                {/* Expandable Category Selection Panel (shows categories on click) */}
                                <AnimatePresence>
                                  {isCategoryDropdownOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.18 }}
                                      className="overflow-hidden pt-1"
                                    >
                                      <div className="p-3 bg-[#0d0214] rounded-xl border border-purple-500/50 space-y-2">
                                        <div className="text-[11px] font-mono text-stone-400 flex items-center justify-between">
                                          <span>
                                            {lang === 'ru'
                                              ? 'Выберите категорию для фильтрации шаблонов:'
                                              : 'Select a category to filter templates:'}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => setIsCategoryDropdownOpen(false)}
                                            className="text-purple-300 hover:text-white cursor-pointer text-xs"
                                          >
                                            {lang === 'ru' ? 'Свернуть' : 'Collapse'}
                                          </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 text-xs font-mono">
                                          {/* Option: All categories */}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setCategoryFilter('all');
                                              setIsCategoryDropdownOpen(false);
                                            }}
                                            className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                                              categoryFilter === 'all'
                                                ? 'bg-purple-600 text-white border-purple-300 font-bold shadow-md ring-1 ring-purple-300'
                                                : 'bg-[#180727] text-stone-300 hover:text-white border-[#3d1a56] hover:bg-[#250d3a]'
                                            }`}
                                          >
                                            <span>{lang === 'ru' ? '✨ Все категории' : '✨ All categories'}</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/40 text-purple-200">
                                              {CALCULATOR_TEMPLATES.length}
                                            </span>
                                          </button>

                                          {/* Categories 1 to 8 */}
                                          {CATEGORIES_LIST.map((cat) => {
                                            const isCatActive = categoryFilter === cat.id;
                                            const count = categoryCounts[cat.id] || 0;
                                            return (
                                              <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => {
                                                  setCategoryFilter(cat.id);
                                                  setIsCategoryDropdownOpen(false);
                                                }}
                                                className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                                                  isCatActive
                                                    ? 'bg-purple-600 text-white border-purple-300 font-bold shadow-md ring-1 ring-purple-300'
                                                    : 'bg-[#180727] text-stone-300 hover:text-white border-[#3d1a56] hover:bg-[#250d3a]'
                                                }`}
                                              >
                                                <div className="truncate pr-2">
                                                  <span className="opacity-60 mr-1.5 font-bold">{cat.id}.</span>
                                                  <span>{lang === 'ru' ? cat.nameRu : cat.nameEn}</span>
                                                </div>
                                                <span
                                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                                    count > 0
                                                      ? isCatActive
                                                        ? 'bg-black/40 text-white'
                                                        : 'bg-purple-900/60 text-purple-200'
                                                      : 'bg-black/30 text-stone-500'
                                                  }`}
                                                >
                                                  {count}
                                                </span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Grid with cards redesigned according to user specifications */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                                {CALCULATOR_TEMPLATES.filter(
                                  (tmpl) => categoryFilter === 'all' || tmpl.categoryId === categoryFilter
                                ).map((tmpl) => {
                                  const isSelected = tmpl.id === item.templateId;
                                  return (
                                    <button
                                      key={tmpl.id}
                                      type="button"
                                      onClick={() => {
                                        onUpdateItem(item.id, 'templateId', tmpl.id);
                                        setOpenMenuId(null);
                                      }}
                                      className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer flex flex-col justify-between relative group ${
                                        isSelected
                                          ? 'bg-gradient-to-b from-[#351450] to-[#1e0730] border-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.35)] ring-2 ring-purple-400/40'
                                          : 'bg-[#180727] hover:bg-[#230c37] border-[#3d1a56] hover:border-purple-400/60'
                                      }`}
                                    >
                                      {/* Top: Center Image / Gray Square */}
                                      <div className="w-full flex justify-center pt-1 pb-3">
                                        <div className="w-28 h-28 sm:w-32 sm:h-32 bg-[#2a2a32] border-2 border-dashed border-[#4d4d5a] rounded-xl flex flex-col items-center justify-center relative overflow-hidden shadow-inner group-hover:border-purple-400/60 transition-colors">
                                          {tmpl.image ? (
                                            <img
                                              src={tmpl.image}
                                              alt={tmpl.titleRu}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <>
                                              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#888_1px,transparent_1px)] [background-size:8px_8px]" />
                                              <div className="w-10 h-10 rounded-lg bg-[#383844] flex items-center justify-center mb-1 text-[#888899] group-hover:text-purple-300 transition-colors">
                                                {getTemplateIcon(tmpl.iconName, 'w-6 h-6')}
                                              </div>
                                              <span className="text-[10px] font-mono text-[#888899] font-bold uppercase tracking-wider group-hover:text-purple-200">
                                                [ Картинка ]
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {/* Middle: Big Title below image */}
                                      <div className="space-y-2 text-center flex-1 flex flex-col items-center">
                                        <h4 className="text-base sm:text-lg font-display font-black text-white leading-snug group-hover:text-purple-200 transition-colors">
                                          {lang === 'ru' ? tmpl.titleRu : tmpl.titleEn}
                                        </h4>

                                        {/* Description below title */}
                                        <p className="text-xs text-[#ebd6f7]/70 leading-relaxed line-clamp-3">
                                          {lang === 'ru' ? tmpl.descRu : tmpl.descEn}
                                        </p>
                                      </div>

                                      {/* Bottom: Price and Dimensions below description */}
                                      <div className="pt-3 mt-3 border-t border-[#3d1a56]/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-purple-300 bg-[#12051d] px-2 py-0.5 rounded border border-[#3d1a56] font-semibold">
                                            {tmpl.defaultWidth}×{tmpl.defaultHeight} px
                                          </span>
                                          <span className="text-[10px] uppercase text-[#ebd6f7]/50 hidden sm:inline">
                                            {lang === 'ru' ? tmpl.badgeRu : tmpl.badgeEn}
                                          </span>
                                        </div>
                                        <span className="text-amber-300 font-bold bg-amber-950/40 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                                          {lang === 'ru'
                                            ? tmpl.approxPriceRangeRu
                                            : tmpl.approxPriceRangeEn}
                                        </span>
                                      </div>

                                      {isSelected && (
                                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg border border-purple-300">
                                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}

                                {CALCULATOR_TEMPLATES.filter(
                                  (tmpl) => categoryFilter === 'all' || tmpl.categoryId === categoryFilter
                                ).length === 0 && (
                                  <div className="col-span-full py-8 text-center text-[#ebd6f7]/60 text-xs font-mono bg-[#180727]/60 rounded-xl border border-dashed border-[#3d1a56]">
                                    {lang === 'ru'
                                      ? 'В данной категории пока нет шаблонов. Вы можете легко добавить их в файле templates.json!'
                                      : 'No templates in this category yet. You can add them in templates.json!'}
                                  </div>
                                )}
                              </div>

                              <div className="pt-2 border-t border-[#3d1a56]/70 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => setOpenMenuId(null)}
                                  className="px-3.5 py-1.5 rounded-xl bg-[#1c082c] hover:bg-purple-950 text-purple-300 hover:text-white text-xs font-mono font-bold border border-[#3d1a56] transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                  <span>{lang === 'ru' ? 'Закрыть меню' : 'Close menu'}</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* 2. Inputs Form Grid: Quantities & Animation Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                      {/* Column 1: Sprite Count */}
                      <div className="space-y-2">
                        <label className="block text-sm font-bold uppercase tracking-wider text-[#ebd6f7]/70 flex items-center justify-between">
                          <span>{lang === 'ru' ? 'Количество спрайтов (шт.)' : 'Sprite Quantity (pcs)'}</span>
                          <span className="text-xs font-mono text-purple-300/80 lowercase">
                            {lang === 'ru' ? 'от 1 до 100' : '1 to 100'}
                          </span>
                        </label>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateItem(item.id, 'count', Math.max(1, item.count - 1))
                            }
                            className="w-11 h-11 rounded-xl bg-[#12051d] hover:bg-purple-950 text-purple-300 hover:text-white border-2 border-[#3d1a56] hover:border-purple-400 flex items-center justify-center font-black cursor-pointer transition-all active:scale-95 shrink-0"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={item.count}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              onUpdateItem(
                                item.id,
                                'count',
                                isNaN(v) ? 1 : Math.max(1, Math.min(100, v))
                              );
                            }}
                            className="w-full h-11 bg-[#12051d] text-white font-mono font-black text-lg text-center rounded-xl border-2 border-[#3d1a56] focus:outline-none focus:border-purple-300 shadow-inner"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              onUpdateItem(item.id, 'count', Math.min(100, item.count + 1))
                            }
                            className="w-11 h-11 rounded-xl bg-[#12051d] hover:bg-purple-950 text-purple-300 hover:text-white border-2 border-[#3d1a56] hover:border-purple-400 flex items-center justify-center font-black cursor-pointer transition-all active:scale-95 shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quick count pills */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {[1, 3, 5, 10, 20].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => onUpdateItem(item.id, 'count', num)}
                              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                                item.count === num
                                  ? 'bg-purple-900/80 text-purple-200 border-purple-400'
                                  : 'bg-[#12051d] text-[#ebd6f7]/60 border-[#3d1a56] hover:border-purple-400/50 hover:text-white'
                              }`}
                            >
                              {num} {lang === 'ru' ? 'шт' : 'pcs'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Column 2: Animation Toggle & Duration */}
                      <div className="space-y-2">
                        <label className="block text-sm font-bold uppercase tracking-wider text-[#ebd6f7]/70 flex items-center justify-between">
                          <span>{lang === 'ru' ? 'Анимация спрайтов' : 'Sprite Animation'}</span>
                          <span className="text-xs font-mono text-purple-300/80">
                            {item.hasAnimation
                              ? lang === 'ru'
                                ? 'Включена'
                                : 'Enabled'
                              : lang === 'ru'
                              ? 'Выключена'
                              : 'Disabled'}
                          </span>
                        </label>

                        {/* Animation Toggle Button */}
                        <button
                          type="button"
                          onClick={() => onUpdateItem(item.id, 'hasAnimation', !item.hasAnimation)}
                          className={`w-full h-11 px-4 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider border-2 transition-all flex items-center justify-between cursor-pointer active:scale-98 ${
                            item.hasAnimation
                              ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-purple-300 shadow-[0_0_15px_rgba(192,132,252,0.35)]'
                              : 'bg-[#12051d] text-[#ebd6f7]/70 border-[#3d1a56] hover:border-purple-400/60 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles
                              className={`w-4 h-4 ${
                                item.hasAnimation ? 'text-amber-300' : 'text-purple-400'
                              }`}
                            />
                            <span>
                              {item.hasAnimation
                                ? lang === 'ru'
                                  ? 'Анимация включена'
                                  : 'Animation Enabled'
                                : lang === 'ru'
                                ? 'Без анимации (статичный)'
                                : 'No Animation (Static)'}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-black">
                            {item.hasAnimation
                              ? lang === 'ru'
                                ? 'ДА'
                                : 'YES'
                              : lang === 'ru'
                              ? 'НЕТ'
                              : 'NO'}
                          </span>
                        </button>

                        {/* Animation Settings Details when enabled */}
                        <AnimatePresence>
                          {item.hasAnimation && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden pt-2 space-y-2.5"
                            >
                              <div className="bg-[#12051d] p-3 rounded-xl border border-[#3d1a56] space-y-2.5">
                                <div>
                                  <span className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">
                                    {lang === 'ru' ? 'Описание движения:' : 'Motion description:'}
                                  </span>
                                  <input
                                    type="text"
                                    value={item.animDesc}
                                    onChange={(e) =>
                                      onUpdateItem(item.id, 'animDesc', e.target.value)
                                    }
                                    placeholder={
                                      lang === 'ru'
                                        ? 'Например: бег, атака мечом или дыхание'
                                        : 'Example: run cycle, sword attack, or breathing'
                                    }
                                    className="w-full bg-[#1a0729] text-white text-xs p-2.5 rounded-lg border border-[#3d1a56] focus:outline-none focus:border-purple-300"
                                  />
                                </div>

                                <div>
                                  <span className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-purple-300" />
                                    <span>{lang === 'ru' ? 'Длительность цикла:' : 'Cycle duration:'}</span>
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onUpdateItem(
                                          item.id,
                                          'animDuration',
                                          Math.max(
                                            0.2,
                                            Math.round((item.animDuration - 0.1) * 10) / 10
                                          )
                                        )
                                      }
                                      className="w-8 h-8 rounded-lg bg-[#1a0729] hover:bg-purple-950 text-purple-300 border border-[#3d1a56] flex items-center justify-center font-bold text-sm cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0.2"
                                      max="10.0"
                                      value={item.animDuration}
                                      onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        onUpdateItem(
                                          item.id,
                                          'animDuration',
                                          isNaN(v) ? 1.0 : Math.max(0.2, Math.min(10.0, v))
                                        );
                                      }}
                                      className="w-full h-8 bg-[#1a0729] text-white font-mono font-bold text-center text-xs rounded-lg border border-[#3d1a56] focus:outline-none focus:border-purple-300"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onUpdateItem(
                                          item.id,
                                          'animDuration',
                                          Math.min(
                                            10.0,
                                            Math.round((item.animDuration + 0.1) * 10) / 10
                                          )
                                        )
                                      }
                                      className="w-8 h-8 rounded-lg bg-[#1a0729] hover:bg-purple-950 text-purple-300 border border-[#3d1a56] flex items-center justify-center font-bold text-sm cursor-pointer"
                                    >
                                      +
                                    </button>
                                    <span className="text-xs font-mono font-bold text-[#ebd6f7]/80 shrink-0">
                                      {lang === 'ru' ? 'сек' : 'sec'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* 3. Quality Selection: EXACT SAME component as Granular Sprite Card */}
                    <div className="mt-5 pt-4 border-t border-[#ebd6f7]/10">
                      <ComplexitySelection
                        value={detailLevel}
                        onChange={handleComplexityChange}
                        lang={lang}
                        spriteId={`template-item-${item.id}`}
                        categoryId={selectedTemplate.categoryId}
                      />
                    </div>

                    {/* 4. Task Description (ТЗ): Enlarged textarea */}
                    <div className="mt-5 pt-4 border-t border-[#ebd6f7]/10">
                      <label className="block text-sm font-bold uppercase tracking-wider text-purple-300 mb-1.5 flex justify-between items-center">
                        <span>{lang === 'ru' ? 'Описание задачи (ТЗ)' : 'Task Description (Specification)'}</span>
                        <span className="text-xs font-mono opacity-70 lowercase">
                          *{lang === 'ru' ? 'обязательно' : 'required'}
                        </span>
                      </label>
                      <textarea
                        rows={7}
                        value={item.taskDesc}
                        onChange={(e) => onUpdateItem(item.id, 'taskDesc', e.target.value)}
                        className="w-full bg-[#12051d] border-2 border-[#3d1a56] rounded-xl px-4 py-3 text-sm text-[#fbf7ff] placeholder-[#ebd6f7]/40 focus:outline-none focus:border-purple-300 focus:bg-[#1c082c] transition-all duration-200 resize-y min-h-[160px] leading-relaxed"
                        placeholder={
                          lang === 'ru'
                            ? 'Подробно опишите задачу: внешний вид, стиль, элементы, материалы, форму...'
                            : 'Describe your vision in detail: shapes, materials, style, colors, mood...'
                        }
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add New Asset Button (Matching granular mode) */}
      <div className="mt-8 relative z-10">
        <button
          type="button"
          onClick={onAddItem}
          className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black text-sm uppercase py-4 rounded-2xl border-4 border-[#140620] shadow-[0_4px_15px_rgba(192,132,252,0.25)] hover:shadow-[0_4px_25px_rgba(192,132,252,0.45)] hover:scale-[1.005] transition-all active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 animate-bounce" />
          <span>{addAssetBtnText}</span>
        </button>
      </div>

      {/* Convert All Templates to Granular Mode Button */}
      <div className="mt-6 pt-5 border-t border-[#ebd6f7]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-[#ebd6f7]/70 font-sans max-w-md">
          {lang === 'ru'
            ? 'Хотите вручную настроить точные размеры, ракурс или отдельные кадры для всех позиций? Преобразуйте шаблоны в точечный расчёт.'
            : 'Need custom canvas dimensions, isometry, or exact frames for all items? Convert all templates into granular mode.'}
        </div>
        <button
          type="button"
          onClick={onConvertToGranular}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#140620] shadow-lg hover:shadow-purple-500/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2.5 shrink-0"
        >
          <Sliders className="w-4 h-4 text-purple-200" />
          <span>
            {lang === 'ru'
              ? `Преобразовать шаблоны (${items.length}) в точечный расчёт`
              : `Convert Templates (${items.length}) to Granular`}
          </span>
          <ArrowRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
