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
    | 'hp'
    | 'mana'
    | 'hunger'
    | 'thirst'
    | 'positive'
    | 'negative'
    | 'item'
    | 'reforged'
    | 'enchanted'
    | 'section'
    | 'subtle';
}

export function tagTooltipLines(
  tags?: string[],
  showTags = true,
): TooltipLine[] {
  if (!showTags || !tags || tags.length === 0) return [];
  return [
    {
      kind: 'text',
      text: `Tags: ${tags.join(', ')}`,
      tone: 'subtle',
    },
  ];
}
