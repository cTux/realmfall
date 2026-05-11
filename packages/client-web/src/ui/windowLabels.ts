import { WINDOW_VISIBILITY_KEYS, type WindowKey } from '../app/constants';
import { t } from '../i18n';

export interface WindowLabelDefinition {
  plain: string;
  prefix: string;
  hotkey: string;
  suffix: string;
}

function createWindowLabel(key: WindowKey): WindowLabelDefinition {
  const baseKey = `ui.window.${key}`;
  return {
    get plain() {
      return t(`${baseKey}.plain`);
    },
    get prefix() {
      return t(`${baseKey}.prefix`);
    },
    get hotkey() {
      return t(`${baseKey}.hotkey`);
    },
    get suffix() {
      return t(`${baseKey}.suffix`);
    },
  };
}

export const WINDOW_LABELS = Object.fromEntries(
  WINDOW_VISIBILITY_KEYS.map((key) => [key, createWindowLabel(key)]),
) as Record<WindowKey, WindowLabelDefinition>;
