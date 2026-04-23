import {
  WINDOW_VISIBILITY_KEYS,
  type WindowKey,
} from '../app/constants';
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
    plain: t(`${baseKey}.plain`),
    prefix: t(`${baseKey}.prefix`),
    hotkey: t(`${baseKey}.hotkey`),
    suffix: t(`${baseKey}.suffix`),
  };
}

export const WINDOW_LABELS = Object.fromEntries(
  WINDOW_VISIBILITY_KEYS.map((key) => [key, createWindowLabel(key)]),
) as Record<WindowKey, WindowLabelDefinition>;
