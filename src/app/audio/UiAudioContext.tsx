import {
  createContext,
  useContext,
  type PropsWithChildren,
} from 'react';

export interface UiAudioController {
  applySettings: (settings: import('../audioSettings').AudioSettings) => void;
  click: () => void;
  error: () => void;
  hover: () => void;
  notify: () => void;
  pop: () => void;
  success: () => void;
  swoosh: () => void;
  toggle: (nextState: boolean) => void;
  warning: () => void;
}

const noop = () => undefined;

export const DEFAULT_UI_AUDIO_CONTROLLER: UiAudioController = {
  applySettings: noop,
  click: noop,
  error: noop,
  hover: noop,
  notify: noop,
  pop: noop,
  success: noop,
  swoosh: noop,
  toggle: noop,
  warning: noop,
};

const UiAudioContext = createContext(DEFAULT_UI_AUDIO_CONTROLLER);

export function UiAudioProvider({
  children,
  value,
}: PropsWithChildren<{ value: UiAudioController }>) {
  return (
    <UiAudioContext.Provider value={value}>{children}</UiAudioContext.Provider>
  );
}

export function useUiAudio() {
  return useContext(UiAudioContext);
}
