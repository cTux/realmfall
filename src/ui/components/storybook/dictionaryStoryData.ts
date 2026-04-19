import { ABILITIES } from '../../../game/abilities';
import { buildItemFromConfig } from '../../../game/content/items';
import { STATUS_EFFECT_DEFINITIONS } from '../../../game/content/statusEffects';
import { enemyIconFor, enemyTint, iconForItem } from '../../icons';
import { rarityColor } from '../../rarity';
import {
  abilityTooltipLines,
  enemyTooltip,
  itemTooltipLines,
  statusEffectTooltipLines,
  structureTooltip,
  type TooltipLine,
} from '../../tooltips';
import { formatStatusEffectLabel } from '../../../i18n/labels';
import { createStorybookFixtures } from './storybookHelpers';

interface IconDictionaryEntry {
  id: string;
  label: string;
  icon: string;
  tint: string;
  borderColor: string;
  tooltipLines: TooltipLine[];
}

export function loadDictionaryCatalogs() {
  const fixtures = createStorybookFixtures();

  return {
    items: fixtures.items.map((config) => ({
      id: config.key,
      label: config.name,
      icon: iconForItem({
        id: config.key,
        itemKey: config.key,
        slot: config.slot,
        name: config.name,
        quantity: 1,
        tier: config.tier,
        rarity: config.rarity,
        power: config.power,
        defense: config.defense,
        maxHp: config.maxHp,
        healing: config.healing,
        hunger: config.hunger,
        thirst: config.thirst,
        tags: config.tags,
      }),
      tint: config.tint ?? rarityColor(config.rarity),
      borderColor: rarityColor(config.rarity),
      tooltipLines: itemTooltipLines(
        buildItemFromConfig(config.key, {
          id: config.key,
          quantity: 1,
        }),
      ),
    })),
    enemies: fixtures.enemies.map((config) => ({
      id: config.id,
      label: config.name,
      icon: enemyIconFor(config.id),
      tint: `#${enemyTint(config.id).toString(16).padStart(6, '0')}`,
      borderColor: 'rgba(148, 163, 184, 0.9)',
      tooltipLines:
        enemyTooltip([
          {
            id: config.id,
            enemyTypeId: config.id,
            name: config.name,
            coord: { q: 0, r: 0 },
            rarity: 'common',
            tier: 1,
            hp: 1,
            maxHp: 1,
            attack: 0,
            defense: 0,
            xp: 0,
            elite: false,
            tags: config.tags,
          },
        ])?.lines ?? [],
    })),
    structures: fixtures.structures.map((config) => ({
      id: config.type,
      label: config.title,
      icon: config.icon,
      tint: `#${config.tint.toString(16).padStart(6, '0')}`,
      borderColor: 'rgba(148, 163, 184, 0.9)',
      tooltipLines:
        structureTooltip({
          coord: { q: 0, r: 0 },
          terrain: 'plains',
          structure: config.type,
          items: [],
          enemyIds: [],
        })?.lines ?? [],
    })),
    abilities: Object.values(ABILITIES).map((ability) => ({
      id: ability.id,
      label: ability.name,
      icon: ability.icon,
      tint: '#f8fafc',
      borderColor: 'rgba(148, 163, 184, 0.9)',
      tooltipLines: abilityTooltipLines(ability, ability.target),
    })),
    buffs: Object.values(STATUS_EFFECT_DEFINITIONS)
      .filter((definition) => definition.tone === 'buff')
      .map((definition) => ({
        id: definition.id,
        label: formatStatusEffectLabel(definition.id),
        icon: definition.icon,
        tint: definition.tint,
        borderColor: 'rgba(34, 197, 94, 0.9)',
        tooltipLines: statusEffectTooltipLines(definition.id, 'buff'),
      })),
    debuffs: Object.values(STATUS_EFFECT_DEFINITIONS)
      .filter((definition) => definition.tone === 'debuff')
      .map((definition) => ({
        id: definition.id,
        label: formatStatusEffectLabel(definition.id),
        icon: definition.icon,
        tint: definition.tint,
        borderColor: 'rgba(239, 68, 68, 0.9)',
        tooltipLines: statusEffectTooltipLines(definition.id, 'debuff'),
      })),
  } satisfies Record<string, IconDictionaryEntry[]>;
}
