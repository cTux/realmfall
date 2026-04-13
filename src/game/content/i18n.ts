import { t } from '../../i18n';

export function itemName(key: string) {
  return t(`game.item.${key}.name`);
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
