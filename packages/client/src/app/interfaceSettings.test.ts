import {
  clearInterfaceSettings,
  DEFAULT_INTERFACE_SETTINGS,
  loadInterfaceSettings,
  saveInterfaceSettings,
} from './interfaceSettings';
import { PERSISTED_SETTINGS_STORAGE_KEYS } from './settingsStorage';

describe('interface settings persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores interface settings in the interface save area', () => {
    saveInterfaceSettings({
      fontFamily: 'ubuntu',
      windowTransparency: 45,
    });

    expect(
      JSON.parse(
        window.localStorage.getItem(
          PERSISTED_SETTINGS_STORAGE_KEYS.interface,
        ) ?? 'null',
      ),
    ).toEqual({
      fontFamily: 'ubuntu',
      windowTransparency: 45,
    });
  });

  it('merges persisted interface settings with defaults', () => {
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.interface,
      JSON.stringify({
        fontFamily: 'roboto',
        windowTransparency: 28,
      }),
    );

    expect(loadInterfaceSettings()).toEqual({
      ...DEFAULT_INTERFACE_SETTINGS,
      fontFamily: 'roboto',
      windowTransparency: 28,
    });
  });

  it('normalizes malformed persisted interface settings', () => {
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.interface,
      JSON.stringify({
        fontFamily: 'broken',
        windowTransparency: 'opaque',
      }),
    );

    expect(loadInterfaceSettings()).toEqual(DEFAULT_INTERFACE_SETTINGS);
  });

  it('clears only the interface save area', () => {
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.interface,
      JSON.stringify({
        fontFamily: 'roboto',
        windowTransparency: 12,
      }),
    );
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.audio,
      JSON.stringify({
        muted: true,
      }),
    );

    clearInterfaceSettings();

    expect(
      window.localStorage.getItem(PERSISTED_SETTINGS_STORAGE_KEYS.interface),
    ).toBeNull();
    expect(
      JSON.parse(
        window.localStorage.getItem(PERSISTED_SETTINGS_STORAGE_KEYS.audio) ??
          'null',
      ),
    ).toEqual({
      muted: true,
    });
  });
});
