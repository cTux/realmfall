import { createContext, useContext, type PropsWithChildren } from 'react';

export interface UiAudioController<TSettings = unknown> {
  applySettings: (settings: TSettings) => void;
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

const UiAudioContext = createContext<UiAudioController>(
  DEFAULT_UI_AUDIO_CONTROLLER,
);

export function UiAudioProvider<TSettings>({
  children,
  value,
}: PropsWithChildren<{ value: UiAudioController<TSettings> }>) {
  return (
    <UiAudioContext.Provider value={value as UiAudioController}>
      {children}
    </UiAudioContext.Provider>
  );
}

export function useUiAudio<TSettings = unknown>() {
  return useContext(UiAudioContext) as UiAudioController<TSettings>;
}
