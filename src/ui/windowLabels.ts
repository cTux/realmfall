import { t } from '../i18n';

export interface WindowLabelDefinition {
  plain: string;
  prefix: string;
  hotkey: string;
  suffix: string;
}

function buildWindowLabel(feature: string): WindowLabelDefinition {
  return {
    plain: t(`ui.window.${feature}.plain`),
    prefix: t(`ui.window.${feature}.prefix`),
    hotkey: t(`ui.window.${feature}.hotkey`),
    suffix: t(`ui.window.${feature}.suffix`),
  };
}

export const WINDOW_LABELS = {
  get worldTime() {
    return buildWindowLabel('worldTime');
  },
  get hero() {
    return buildWindowLabel('hero');
  },
  get skills() {
    return buildWindowLabel('skills');
  },
  get recipes() {
    return buildWindowLabel('recipes');
  },
  get hexInfo() {
    return buildWindowLabel('hexInfo');
  },
  get equipment() {
    return buildWindowLabel('equipment');
  },
  get inventory() {
    return buildWindowLabel('inventory');
  },
  get loot() {
    return buildWindowLabel('loot');
  },
  get log() {
    return buildWindowLabel('log');
  },
  get combat() {
    return buildWindowLabel('combat');
  },
} as const;
