import { getItemCategory, type ItemCategory } from '../game/content/items';
import type {
  EnemyRarity,
  EquipmentSlot,
  Item,
  LogKind,
  SecondaryStatKey,
  SkillName,
  Terrain,
} from '../game/types';
import { t } from './index';

export function formatTerrainLabel(terrain: Terrain) {
  return t(`game.terrain.${terrain}.label`);
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

export function formatSecondaryStatLabel(stat: SecondaryStatKey) {
  return t(`ui.secondaryStat.${stat}`);
}
