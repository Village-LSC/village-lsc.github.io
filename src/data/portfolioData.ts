import worksByCategory from 'virtual:portfolio-works';

export type Language = 'ru' | 'en';
export type Currency = 'rub' | 'usd';

export interface PriceRange {
  low: number;
  high: number;
}

export interface PortfolioSprite {
  id: string;
  src: string;
  titleRu: string;
  titleEn: string;
  sizeLabel: string;
  fileName: string;
}

export interface PortfolioCategory {
  id: string;
  indexLabel: string;
  nameRu: string;
  nameEn: string;
  descriptionRu: string;
  descriptionEn: string;
  noteRu?: string;
  noteEn?: string;
  priceSummaryRub: PriceRange;
  popularSizeRu: string;
  popularSizeEn: string;
  customAvatar?: 'particle-question';
  sprites: PortfolioSprite[];
}

export interface SocialLinkItem {
  id: 'telegram' | 'discord' | 'email' | 'boosty' | 'artstation' | 'bluesky';
  label: string;
  value: string;
  href?: string;
  copyText?: string;
}

export interface PaymentMethod {
  id: 'card-sbp' | 'crypto' | 'boosty';
  titleRu: string;
  titleEn: string;
  subtitleRu: string;
  subtitleEn: string;
  detailLabelRu: string;
  detailLabelEn: string;
  value: string;
  href?: string;
  copyText: string;
  noteRu?: string;
  noteEn?: string;
}

export const DEFAULT_USD_RATE = 82;

export const SOCIAL_LINKS: SocialLinkItem[] = [
  {
    id: 'telegram',
    label: 'Telegram',
    value: '@Village_Village',
    href: 'https://t.me/Village_Village',
    copyText: '@Village_Village',
  },
  {
    id: 'discord',
    label: 'Discord',
    value: '@villagelsc_',
    copyText: '@villagelsc_',
  },
  {
    id: 'email',
    label: 'Email',
    value: 'errorsbills@gmail.com',
    href: 'mailto:errorsbills@gmail.com',
    copyText: 'errorsbills@gmail.com',
  },
  {
    id: 'boosty',
    label: 'Boosty',
    value: 'boosty.to/village_lsc',
    href: 'https://boosty.to/village_lsc',
  },
  {
    id: 'artstation',
    label: 'ArtStation',
    value: 'artstation.com/artwork/rlwkDm',
    href: 'https://www.artstation.com/artwork/rlwkDm',
  },
  {
    id: 'bluesky',
    label: 'Bluesky',
    value: '@village0.bsky.social',
    href: 'https://bsky.app/profile/village0.bsky.social',
  },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card-sbp',
    titleRu: 'Карта / СБП',
    titleEn: 'Card / SBP',
    subtitleRu: 'Быстрая оплата картой или через СБП по платёжной ссылке Сбербанка.',
    subtitleEn: 'Fast payment by bank card or SBP via the Sberbank payment link.',
    detailLabelRu: 'Ссылка на оплату',
    detailLabelEn: 'Payment link',
    value: 'https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79198974087&bankCode=100000000111',
    href: 'https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79198974087&bankCode=100000000111',
    copyText: 'https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79198974087&bankCode=100000000111',
  },
  {
    id: 'crypto',
    titleRu: 'Крипта',
    titleEn: 'Crypto',
    subtitleRu: 'Перевод в стейблкоине USDT через сеть TON.',
    subtitleEn: 'Transfer in USDT via the TON network.',
    detailLabelRu: 'Кошелёк USDT (TON)',
    detailLabelEn: 'USDT (TON) Wallet',
    value: 'UQCDK944xuH6IQNC098A1NnXr0Ou1Q5jCN-JbbsJW8FDg05Z',
    copyText: 'UQCDK944xuH6IQNC098A1NnXr0Ou1Q5jCN-JbbsJW8FDg05Z',
    noteRu: 'Перед отправкой убедитесь, что выбрана сеть TON.',
    noteEn: 'Make sure the TON network is selected before sending.',
  },
  {
    id: 'boosty',
    titleRu: 'Boosty',
    titleEn: 'Boosty',
    subtitleRu: 'Оплата через сервис Boosty (включая зарубежные карты).',
    subtitleEn: 'Payment via Boosty (supports international cards).',
    detailLabelRu: 'Страница Boosty',
    detailLabelEn: 'Boosty page',
    value: 'https://boosty.to/village_lsc',
    href: 'https://boosty.to/village_lsc',
    copyText: 'https://boosty.to/village_lsc',
  },
];

function buildCategorySprites(
  categoryId: string,
  titlePrefixRu: string,
  titlePrefixEn: string,
  sizeLabel: string
): PortfolioSprite[] {
  const files = worksByCategory[categoryId] ?? [];
  const baseUrl = import.meta.env.BASE_URL || '/';

  return files.map((file, idx) => ({
    id: `cat${categoryId}-${idx}-${file.fileName}`,
    src: `${baseUrl}${file.path}`,
    titleRu: `${titlePrefixRu} — ${idx + 1}`,
    titleEn: `${titlePrefixEn} — ${idx + 1}`,
    sizeLabel,
    fileName: file.fileName,
  }));
}

export const PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  {
    id: '1',
    indexLabel: '01',
    nameRu: 'Предметы, тайлы и окружение',
    nameEn: 'Items, Tiles & Environment',
    descriptionRu:
      'Оружие, броня, зелья, декорации локаций, блоки и тайлы.',
    descriptionEn:
      'Weapons, armor, potions, location props, blocks, and tiles.',
    priceSummaryRub: { low: 150, high: 150 },
    popularSizeRu: '16×16 – 128×128 px',
    popularSizeEn: '16×16 – 128×128 px',
    sprites: buildCategorySprites('1', 'Предмет / Ассет', 'Item / Asset', 'Предмет / Ассет'),
  },
  {
    id: '2',
    indexLabel: '02',
    nameRu: 'Текстурирование 3D-моделей',
    nameEn: '3D Model Texturing',
    descriptionRu:
      'Пиксельные текстуры и развёртки для low-poly моделей (Blockbench, оружие, техника, мобы).',
    descriptionEn:
      'Pixel-art texture maps and UV painting for low-poly models (Blockbench weapons, props, machinery, mobs).',
    noteRu: 'Оценка идёт по размеру текстуры, а не по сложности 3D-модели.',
    noteEn: 'Priced by texture size rather than 3D model complexity.',
    priceSummaryRub: { low: 250, high: 250 },
    popularSizeRu: '32×32 – 256×256 px',
    popularSizeEn: '32×32 – 256×256 px',
    sprites: buildCategorySprites('2', 'Текстура модели', 'Model Texture', 'Low-poly UV'),
  },
  {
    id: '3',
    indexLabel: '03',
    nameRu: 'UI: Базовые элементы',
    nameEn: 'UI: Basic Elements',
    descriptionRu:
      'Игровые кнопки с состояниями нажатия, шкалы HP/MP/опыта, иконки навыков и ячеек инвентаря.',
    descriptionEn:
      'Game buttons with hover/pressed states, HP/MP/XP bars, skill icons, and inventory slots.',
    priceSummaryRub: { low: 150, high: 150 },
    popularSizeRu: '16×16 – 128×128 px',
    popularSizeEn: '16×16 – 128×128 px',
    sprites: buildCategorySprites('3', 'Базовый UI', 'Basic UI', 'UI-элемент'),
  },
  {
    id: '4',
    indexLabel: '04',
    nameRu: 'UI: Окна, шрифты и подложки',
    nameEn: 'UI: Windows, Fonts & Backplates',
    descriptionRu:
      'Окна инвентаря, крафта и магазинов, кастомные пиксельные шрифты и статичные экраны меню.',
    descriptionEn:
      'Inventory, crafting, and shop windows, custom pixel fonts, and static menu backplates.',
    priceSummaryRub: { low: 300, high: 300 },
    popularSizeRu: '64×64 – 320×320 px',
    popularSizeEn: '64×64 – 320×320 px',
    sprites: buildCategorySprites('4', 'Интерфейсное окно', 'UI Window', 'Окно / Макет'),
  },
  {
    id: '5',
    indexLabel: '05',
    nameRu: 'UI: Сложные фоны и логотипы',
    nameEn: 'UI: Complex Backdrops & Logos',
    descriptionRu:
      'Художественные панорамы главного меню, заставки, а также различные титульные и прочие логотипы.',
    descriptionEn:
      'Artistic menu panoramas, cutscene backdrops, and various title and custom logos.',
    priceSummaryRub: { low: 700, high: 700 },
    popularSizeRu: '128×128 – 352×352 px',
    popularSizeEn: '128×128 – 352×352 px',
    sprites: buildCategorySprites('5', 'Сложный логотип / фон', 'Complex UI / Logo', 'Титульный арт'),
  },
  {
    id: '6',
    indexLabel: '06',
    nameRu: 'Портреты и спрайты диалогов',
    nameEn: 'Portraits & Dialogue Sprites',
    descriptionRu:
      'Портреты персонажей и эмоции для диалоговых окон, квестов и профилей.',
    descriptionEn:
      'Character portraits and expressions for dialogue boxes, quest logs, and profiles.',
    noteRu: 'Только до плеч (голова и плечи), не в полный рост.',
    noteEn: 'Head-and-shoulders format only, no full-body sprites.',
    priceSummaryRub: { low: 250, high: 250 },
    popularSizeRu: '32×32 – 256×256 px',
    popularSizeEn: '32×32 – 256×256 px',
    sprites: buildCategorySprites('6', 'Портрет', 'Portrait', 'Диалоговый портрет'),
  },
  {
    id: '7',
    indexLabel: '07',
    nameRu: 'Minecraft-скины',
    nameEn: 'Minecraft Skins',
    descriptionRu:
      'Скины стандартного формата (включая небольшие детали) и прорисовка брони. Предпочтительно формат 64×64.',
    descriptionEn:
      'Standard Minecraft skins (including subtle extra details) and custom armor painting. Preferably 64×64 format.',
    priceSummaryRub: { low: 250, high: 250 },
    popularSizeRu: '64×64 px',
    popularSizeEn: '64×64 px',
    sprites: buildCategorySprites('7', 'Minecraft-скин', 'Minecraft Skin', 'Скин 64×64'),
  },
  {
    id: '8',
    indexLabel: '08',
    nameRu: 'Иное',
    nameEn: 'Other',
    descriptionRu:
      'Нестандартные задачи, не подходящие под вышеописанные категории.',
    descriptionEn:
      'Non-standard tasks that do not fit the categories listed above.',
    priceSummaryRub: { low: 100, high: 1000 },
    popularSizeRu: 'Индивидуально',
    popularSizeEn: 'Custom size',
    customAvatar: 'particle-question',
    sprites: [],
  },
];

export function formatPriceValue(
  rubAmount: number,
  currency: Currency,
  lang: Language,
  usdRate: number = DEFAULT_USD_RATE
): string {
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US';
  if (currency === 'usd') {
    const rawUsd = rubAmount / usdRate;
    const usd =
      rawUsd < 10
        ? Math.max(1, Math.round(rawUsd * 2) / 2)
        : Math.max(1, Math.round(rawUsd));
    return `$${usd.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}`;
  }
  return `${Math.round(rubAmount).toLocaleString(locale)} ₽`;
}

export function formatPriceRange(
  range: PriceRange,
  currency: Currency,
  lang: Language,
  usdRate: number = DEFAULT_USD_RATE
): string {
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US';
  if (currency === 'usd') {
    const lowUsd = Math.max(1, Math.round((range.low / usdRate) * 2) / 2);
    const highUsd = Math.max(lowUsd, Math.round((range.high / usdRate) * 2) / 2);
    return `$${lowUsd.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 1 })} – $${highUsd.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}`;
  }
  return `${range.low.toLocaleString(locale)} – ${range.high.toLocaleString(locale)} ₽`;
}

export function formatCategoryMinAmount(
  range: PriceRange,
  currency: Currency,
  lang: Language,
  usdRate: number = DEFAULT_USD_RATE
): string {
  if (range.low === range.high) {
    return formatPriceValue(range.low, currency, lang, usdRate);
  }

  const lowFormatted = formatPriceValue(range.low, currency, lang, usdRate);
  const highFormatted = formatPriceValue(range.high, currency, lang, usdRate);

  if (currency === 'usd') {
    return lang === 'ru'
      ? `от ${lowFormatted} до ${highFormatted}`
      : `${lowFormatted} – ${highFormatted}`;
  }

  return lang === 'ru'
    ? `от ${lowFormatted.replace(' ₽', '')} до ${highFormatted}`
    : `${lowFormatted} – ${highFormatted}`;
}

export function formatCategoryMinPrice(
  range: PriceRange,
  currency: Currency,
  lang: Language,
  usdRate: number = DEFAULT_USD_RATE
): string {
  const amount = formatCategoryMinAmount(range, currency, lang, usdRate);
  return lang === 'ru' ? `Минимальная цена: ${amount}` : `Min. price: ${amount}`;
}
