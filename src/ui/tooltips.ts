import {
  isGatheringStructure,
  type Enemy,
  type Item,
  type StructureType,
  type Tile,
} from '../game/state';
import { HOME_SCROLL_ITEM_NAME } from '../game/config';

export interface TooltipLine {
  text?: string;
  label?: string;
  value?: string;
  current?: number;
  max?: number;
  kind?: 'text' | 'stat' | 'bar';
  tone?: 'positive' | 'negative' | 'item' | 'section';
}

export function comparisonLines(item: Item, equipped?: Item) {
  if (item.kind === 'consumable' || item.kind === 'resource') return [];
  const compare = equipped ?? { power: 0, defense: 0, maxHp: 0 };
  return [
    { label: 'Attack', value: item.power - compare.power },
    { label: 'Defense', value: item.defense - compare.defense },
    { label: 'Max Health', value: item.maxHp - compare.maxHp },
  ].filter((line) => line.value !== 0);
}

export function itemTooltipLines(item: Item, equipped?: Item): TooltipLine[] {
  if (item.kind === 'consumable') {
    return [{ kind: 'text', text: consumableEffectDescription(item) }];
  }

  const lines: TooltipLine[] =
    item.kind === 'resource'
      ? []
      : [
          {
            kind: 'text',
            text: `${item.rarity.toUpperCase()} TIER ${item.tier} ${itemTypeLabel(item)}`,
          },
        ];

  if (item.kind === 'resource') {
    lines.push({ kind: 'stat', label: 'Type', value: 'Resource' });
  } else {
    if (item.power !== 0)
      lines.push({
        kind: 'stat',
        label: 'Attack',
        value: `+${item.power}`,
        tone: 'item',
      });
    if (item.defense !== 0)
      lines.push({
        kind: 'stat',
        label: 'Defense',
        value: `+${item.defense}`,
        tone: 'item',
      });
    if (item.maxHp !== 0)
      lines.push({
        kind: 'stat',
        label: 'Max Health',
        value: `+${item.maxHp}`,
        tone: 'item',
      });
  }

  if (item.quantity > 1) {
    lines.push({ kind: 'stat', label: 'Qty', value: `${item.quantity}` });
  }

  if (equipped) {
    const deltas = comparisonLines(item, equipped);

    lines.push({
      kind: 'text',
      text: 'Comparing to equipped',
      tone: 'section',
    });

    if (deltas.length === 0) {
      lines.push({
        kind: 'text',
        text: 'Same as equipped',
      });
    } else {
      deltas.forEach((line) => {
        lines.push({
          kind: 'stat',
          label: `${line.label} Change`,
          value: `${line.value >= 0 ? '+' : ''}${line.value}`,
          tone: line.value < 0 ? 'negative' : 'item',
        });
      });
    }
  }

  return lines;
}

export function enemyTooltip(
  enemies: Enemy[],
  structure?: StructureType,
): { title: string; lines: TooltipLine[] } | null {
  if (enemies.length === 0) return null;

  if (enemies.length === 1 && structure !== 'dungeon') {
    const [enemy] = enemies;
    return {
      title: enemy.name,
      lines: [
        { kind: 'stat', label: 'Level', value: `${enemy.tier}` },
        { kind: 'stat', label: 'Enemies', value: '1' },
      ],
    };
  }

  const maxTier = Math.max(...enemies.map((enemy) => enemy.tier));

  return {
    title: structure === 'dungeon' ? 'Dungeon' : 'Enemy Party',
    lines: [
      { kind: 'stat', label: 'Level', value: `${maxTier}` },
      { kind: 'stat', label: 'Enemies', value: `${enemies.length}` },
    ],
  };
}

export function structureTooltip(
  tile: Tile,
): { title: string; lines: TooltipLine[] } | null {
  if (!tile.structure) return null;

  if (isGatheringStructure(tile.structure)) {
    return {
      title: structureTitle(tile.structure),
      lines: [{ kind: 'text', text: structureDescription(tile.structure) }],
    };
  }

  return {
    title: structureTitle(tile.structure),
    lines: [{ kind: 'text', text: structureDescription(tile.structure) }],
  };
}

function consumableEffectDescription(item: Item) {
  if (item.name === HOME_SCROLL_ITEM_NAME) {
    return 'Use to return instantly to your home hex.';
  }

  const effects = [
    item.healing > 0 ? `recover ${item.healing} HP` : null,
    item.hunger > 0 ? `restore ${item.hunger} hunger` : null,
  ].filter((effect): effect is string => Boolean(effect));

  if (effects.length === 0) return 'Use to trigger its effect.';
  if (effects.length === 1) return `Use to ${effects[0]}.`;
  return `Use to ${effects[0]} and ${effects[1]}.`;
}

function itemTypeLabel(item: Item) {
  if (item.kind === 'weapon') return 'WEAPON';
  if (item.kind === 'artifact') {
    return item.slot ? `${slotLabel(item.slot)} ARTIFACT` : 'ARTIFACT';
  }
  if (item.kind === 'armor') {
    return item.slot ? `${slotLabel(item.slot)} ARMOR` : 'ARMOR';
  }
  return item.kind.toUpperCase();
}

function slotLabel(slot: NonNullable<Item['slot']>) {
  switch (slot) {
    case 'ringLeft':
      return 'LEFT RING';
    case 'ringRight':
      return 'RIGHT RING';
    default:
      return slot
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toUpperCase();
  }
}

function structureTitle(structure: StructureType) {
  switch (structure) {
    case 'camp':
      return 'Campfire';
    case 'workshop':
      return 'Workshop';
    case 'copper-ore':
      return 'Copper Vein';
    case 'iron-ore':
      return 'Iron Vein';
    case 'coal-ore':
      return 'Coal Seam';
    case 'herbs':
      return 'Herb Patch';
    default:
      return structure.charAt(0).toUpperCase() + structure.slice(1);
  }
}

function structureDescription(structure: StructureType) {
  switch (structure) {
    case 'town':
      return 'A safe haven for trade, supplies, and a brief respite.';
    case 'forge':
      return 'A blazing forge where gear can be prospected into gold.';
    case 'camp':
      return 'A campfire used to cook provisions into better meals.';
    case 'workshop':
      return 'A workbench for turning gathered materials into equipment.';
    case 'dungeon':
      return 'A hostile den packed with stronger enemies and danger.';
    case 'tree':
      return 'A logging node that yields logs when harvested.';
    case 'herbs':
      return 'A fragrant patch that yields herbs when gathered.';
    case 'pond':
      return 'A fishing spot that yields raw fish when worked.';
    case 'lake':
      return 'A broad fishing spot that yields raw fish when worked.';
    case 'copper-ore':
      return 'A mining vein that yields copper ore when harvested.';
    case 'iron-ore':
      return 'A mining vein that yields iron ore when harvested.';
    case 'coal-ore':
      return 'A mining seam that yields coal when harvested.';
  }
}
