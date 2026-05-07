import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_GRAPHICS_SETTINGS,
} from '../../../../../app/constants';
import type { GameSettingsSavePayload } from '../../types';

export const DEFAULT_INTERFACE_SETTINGS = {
  language: 'en' as const,
  fontFamily: 'pixelifySans' as const,
  fontSize: 100,
  interfaceScale: 100,
  showTooltipTags: true,
  windowTransparency: 0,
};

export const DEFAULT_GAMEPLAY_SETTINGS = {
  autoGatherResources: false,
  autoLoot: false,
};

export const DEFAULT_SAVE_PAYLOAD: GameSettingsSavePayload = {
  audio: DEFAULT_AUDIO_SETTINGS,
  gameplay: DEFAULT_GAMEPLAY_SETTINGS,
  graphics: DEFAULT_GRAPHICS_SETTINGS,
  interface: DEFAULT_INTERFACE_SETTINGS,
};

export { DEFAULT_AUDIO_SETTINGS, DEFAULT_GRAPHICS_SETTINGS };
