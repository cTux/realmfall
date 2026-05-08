import type { AudioSettings } from '../audioSettings';
import type { UiAudioController as BaseUiAudioController } from '@realmfall/ui';

export type UiAudioController = BaseUiAudioController<AudioSettings>;
export {
  DEFAULT_UI_AUDIO_CONTROLLER,
  UiAudioProvider,
  useUiAudio,
} from '@realmfall/ui';
export type { AudioSettings };
