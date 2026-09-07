import templatesJson from './templates.json';

export interface CalculatorTemplate {
  id: string;
  categoryId: string;
  iconName?: 'sword' | 'user' | 'layers' | 'flame' | 'layout' | 'sparkles' | 'box' | 'image' | string;
  image?: string;
  badgeRu: string;
  badgeEn: string;
  titleRu: string;
  titleEn: string;
  descRu: string;
  descEn: string;
  approxPriceRangeRu: string;
  approxPriceRangeEn: string;
  approxBasePrice: number;
  defaultWidth: number;
  defaultHeight: number;
  defaultCountOrig: number;
  defaultCountVar: number;
  hasAnimation: boolean;
  defaultDuration: number;
  defaultQuality: 'optimal' | 'medium' | 'best';
  defaultAnimComplexity: 'simple' | 'medium' | 'complex';
  defaultDetailLevel: 'simple' | 'moderate' | 'detailed';
  defaultTaskDescRu: string;
  defaultTaskDescEn: string;
  defaultAnimDescRu: string;
  defaultAnimDescEn: string;
}

export const CALCULATOR_TEMPLATES: CalculatorTemplate[] = (templatesJson.templates || []) as CalculatorTemplate[];
