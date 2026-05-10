import { getItemCategory, type ItemCategory } from '../game/content/items';
import type {
  EnemyRarity,
  EquipmentSlot,
  Item,
  LogKind,
  SecondaryStatKey,
  SkillName,
  Terrain,
} from '../game/stateTypes';
import { t } from './index';

type DungeonTerrainTheme = 'brick' | 'mud' | 'obsidian';

const DUNGEON_TERRAIN_THEME_BY_ID: Partial<
  Record<Terrain, DungeonTerrainTheme>
> = {
  'dungeon-brick-floor': 'brick',
  'dungeon-brick-cracked': 'brick',
  'dungeon-brick-moss': 'brick',
  'dungeon-brick-wall': 'brick',
  'dungeon-mud-floor': 'mud',
  'dungeon-mud-rut': 'mud',
  'dungeon-mud-puddle': 'mud',
  'dungeon-mud-wall': 'mud',
  'dungeon-obsidian-floor': 'obsidian',
  'dungeon-obsidian-ash': 'obsidian',
  'dungeon-obsidian-ember': 'obsidian',
  'dungeon-obsidian-wall': 'obsidian',
};

export function formatTerrainLabel(terrain: Terrain) {
  const dungeonTheme = DUNGEON_TERRAIN_THEME_BY_ID[terrain];
  if (dungeonTheme) {
    return t(`game.terrain.dungeon.${dungeonTheme}`);
  }

  return t(`game.terrain.${terrain}.label`);
}

export function formatTerrainDescription(terrain: Terrain) {
  const dungeonTheme = DUNGEON_TERRAIN_THEME_BY_ID[terrain];
  if (dungeonTheme) {
    return t(`game.terrain.dungeon.${dungeonTheme}`);
  }

  return t(`game.terrain.${terrain}.description`);
}

export function formatSkillLabel(skill: SkillName) {
  return t(`game.skill.${skill}.label`);
}

export function formatEquipmentSlotLabel(slot: EquipmentSlot) {
  return t(`ui.equipmentSlot.${slot}.label`);
}

export function formatItemKindLabel(kind: ItemCategory) {
  return t(`ui.itemKind.${kind}.label`);
}

export function formatEnemyRarityLabel(rarity: EnemyRarity) {
  return t(`ui.rarity.${rarity}`);
}

export function formatItemLabel(
  item: Pick<Item, 'name'> &
    Partial<
      Pick<
        Item,
        | 'itemKey'
        | 'slot'
        | 'recipeId'
        | 'power'
        | 'defense'
        | 'maxHp'
        | 'healing'
        | 'hunger'
        | 'thirst'
        | 'tags'
      >
    >,
) {
  return formatItemKindLabel(getItemCategory(item));
}

export function formatLogKindLabel(kind: LogKind) {
  return t(`ui.log.kind.${kind}.label`);
}

export function formatStatusEffectLabel(statusEffectName: string) {
  return t(`ui.statusEffect.${statusEffectName}.label`);
}

export function formatAbilityLabel(abilityId: string) {
  return t(`game.ability.${abilityId}.name`);
}

export function formatSecondaryStatLabel(stat: SecondaryStatKey) {
  return t(`ui.secondaryStat.${stat}`);
}
