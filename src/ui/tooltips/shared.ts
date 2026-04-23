import { t } from '../../i18n';

export interface TooltipLine {
  text?: string;
  label?: string;
  value?: string;
  icon?: string;
  iconTint?: string;
  current?: number;
  max?: number;
  kind?: 'text' | 'stat' | 'bar';
  tone?:
    | 'positive'
    | 'negative'
    | 'item'
    | 'reforged'
    | 'enchanted'
    | 'section'
    | 'subtle';
}

export function tagTooltipLines(tags?: string[]): TooltipLine[] {
  if (!tags || tags.length === 0) return [];

  return [
    {
      kind: 'text',
      text: t('ui.tooltip.tags', { tags: tags.join(', ') }),
      tone: 'subtle',
    },
  ];
}
