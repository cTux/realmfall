import { t } from '../i18n';

export interface WindowLabelDefinition {
  plain: string;
  prefix: string;
  hotkey: string;
  suffix: string;
}

export const WINDOW_LABELS = {
  worldTime: {
    plain: t('ui.window.worldTime.plain'),
    prefix: t('ui.window.worldTime.prefix'),
    hotkey: t('ui.window.worldTime.hotkey'),
    suffix: t('ui.window.worldTime.suffix'),
  },
  hero: {
    plain: t('ui.window.hero.plain'),
    prefix: t('ui.window.hero.prefix'),
    hotkey: t('ui.window.hero.hotkey'),
    suffix: t('ui.window.hero.suffix'),
  },
  skills: {
    plain: t('ui.window.skills.plain'),
    prefix: t('ui.window.skills.prefix'),
    hotkey: t('ui.window.skills.hotkey'),
    suffix: t('ui.window.skills.suffix'),
  },
  recipes: {
    plain: t('ui.window.recipes.plain'),
    prefix: t('ui.window.recipes.prefix'),
    hotkey: t('ui.window.recipes.hotkey'),
    suffix: t('ui.window.recipes.suffix'),
  },
  hexInfo: {
    plain: t('ui.window.hexInfo.plain'),
    prefix: t('ui.window.hexInfo.prefix'),
    hotkey: t('ui.window.hexInfo.hotkey'),
    suffix: t('ui.window.hexInfo.suffix'),
  },
  equipment: {
    plain: t('ui.window.equipment.plain'),
    prefix: t('ui.window.equipment.prefix'),
    hotkey: t('ui.window.equipment.hotkey'),
    suffix: t('ui.window.equipment.suffix'),
  },
  inventory: {
    plain: t('ui.window.inventory.plain'),
    prefix: t('ui.window.inventory.prefix'),
    hotkey: t('ui.window.inventory.hotkey'),
    suffix: t('ui.window.inventory.suffix'),
  },
  loot: {
    plain: t('ui.window.loot.plain'),
    prefix: t('ui.window.loot.prefix'),
    hotkey: t('ui.window.loot.hotkey'),
    suffix: t('ui.window.loot.suffix'),
  },
  log: {
    plain: t('ui.window.log.plain'),
    prefix: t('ui.window.log.prefix'),
    hotkey: t('ui.window.log.hotkey'),
    suffix: t('ui.window.log.suffix'),
  },
  combat: {
    plain: t('ui.window.combat.plain'),
    prefix: t('ui.window.combat.prefix'),
    hotkey: t('ui.window.combat.hotkey'),
    suffix: t('ui.window.combat.suffix'),
  },
  settings: {
    plain: t('ui.window.settings.plain'),
    prefix: t('ui.window.settings.prefix'),
    hotkey: t('ui.window.settings.hotkey'),
    suffix: t('ui.window.settings.suffix'),
  },
} as const;
