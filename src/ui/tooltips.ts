import type { Item } from '../game/state';

export interface TooltipLine {
  text: string;
  tone?: 'positive' | 'negative';
}

export function comparisonLines(item: Item, equipped?: Item) {
  if (item.kind === 'consumable' || item.kind === 'resource') return [];
  const compare = equipped ?? { power: 0, defense: 0, maxHp: 0 };
  return [
    { label: 'ATK', value: item.power - compare.power },
    { label: 'DEF', value: item.defense - compare.defense },
    { label: 'HP', value: item.maxHp - compare.maxHp },
  ].filter((line) => line.value !== 0);
}

export function itemTooltipLines(item: Item, equipped?: Item): TooltipLine[] {
  const lines = [
    { text: item.rarity.toUpperCase() },
    item.kind === 'consumable' || item.kind === 'resource'
      ? null
      : { text: `Tier ${item.tier}` },
    item.kind === 'consumable'
      ? { text: `Heal ${item.healing} / Food ${item.hunger}` }
      : null,
    item.kind === 'resource' ? { text: 'Resource' } : null,
    item.kind !== 'consumable' && item.kind !== 'resource' && item.power !== 0
      ? { text: `ATK ${item.power}` }
      : null,
    item.kind !== 'consumable' && item.kind !== 'resource' && item.defense !== 0
      ? { text: `DEF ${item.defense}` }
      : null,
    item.kind !== 'consumable' && item.kind !== 'resource' && item.maxHp !== 0
      ? { text: `HP ${item.maxHp}` }
      : null,
    item.quantity > 1 ? { text: `Qty ${item.quantity}` } : null,
  ].filter(Boolean) as TooltipLine[];

  if (equipped) {
    comparisonLines(item, equipped).forEach((line) => {
      lines.push({
        text: `${line.label} ${line.value >= 0 ? '+' : ''}${line.value}`,
        tone: line.value > 0 ? 'positive' : 'negative',
      });
    });
  }

  return lines;
}
