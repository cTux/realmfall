import { t } from '../../i18n';
import { getGeneratedCraftingLore } from './generatedCraftingLore';

export function itemName(key: string) {
  return getGeneratedCraftingLore(key)?.name ?? t(`game.item.${key}.name`);
}

export function recipeName(id: string, outputItemKey?: string) {
  return (
    (outputItemKey
      ? getGeneratedCraftingLore(outputItemKey)?.name
      : undefined) ?? t(`game.recipe.${id}.name`)
  );
}

export function recipeDescription(id: string, outputItemKey?: string) {
  return (
    (outputItemKey
      ? getGeneratedCraftingLore(outputItemKey)?.description
      : undefined) ?? t(`game.recipe.${id}.description`)
  );
}

export function enemyName(key: string) {
  return t(`game.enemy.${key}.name`);
}

export function structureTitle(type: string) {
  return t(`game.structure.${type}.title`);
}

export function structureDescription(type: string) {
  return t(`game.structure.${type}.description`);
}

export function structureActionLabel(type: string) {
  return t(`game.structure.${type}.gather.actionLabel`);
}

export function structureDepletedText(type: string) {
  return t(`game.structure.${type}.gather.depletedText`);
}

export function structureGatherVerb(type: string) {
  return t(`game.structure.${type}.gather.verb`);
}
