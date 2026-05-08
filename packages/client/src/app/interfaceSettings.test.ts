import {
  clearInterfaceSettings,
  DEFAULT_INTERFACE_SETTINGS,
  loadInterfaceSettings,
  saveInterfaceSettings,
} from './interfaceSettingsTestkit';
import { PERSISTED_SETTINGS_STORAGE_KEYS } from './settingsStorage';

describe('interface settings persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores interface settings in the interface save area', () => {
    saveInterfaceSettings({
      language: 'en',
      fontFamily: 'ubuntu',
      fontSize: 118,
      interfaceScale: 126,
      showTooltipTags: false,
      windowTransparency: 45,
    });

    expect(
      JSON.parse(
        window.localStorage.getItem(
          PERSISTED_SETTINGS_STORAGE_KEYS.interface,
        ) ?? 'null',
      ),
    ).toEqual({
      language: 'en',
      fontFamily: 'ubuntu',
      fontSize: 118,
      interfaceScale: 126,
      showTooltipTags: false,
      windowTransparency: 45,
    });
  });

  it('merges persisted interface settings with defaults', () => {
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.interface,
      JSON.stringify({
        language: 'en',
        fontFamily: 'roboto',
        fontSize: 118,
        interfaceScale: 126,
        showTooltipTags: false,
        windowTransparency: 28,
      }),
    );

    expect(loadInterfaceSettings()).toEqual({
      ...DEFAULT_INTERFACE_SETTINGS,
      language: 'en',
      fontFamily: 'roboto',
      fontSize: 118,
      interfaceScale: 126,
      showTooltipTags: false,
      windowTransparency: 28,
    });
  });

  it('normalizes malformed persisted interface settings', () => {
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.interface,
      JSON.stringify({
        language: 'broken',
        fontFamily: 'broken',
        fontSize: 999,
        interfaceScale: -20,
        showTooltipTags: 'broken',
        windowTransparency: 'opaque',
      }),
    );

    expect(loadInterfaceSettings()).toEqual({
      ...DEFAULT_INTERFACE_SETTINGS,
      fontSize: 150,
      interfaceScale: 75,
    });
  });

  it('clears only the interface save area', () => {
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.interface,
      JSON.stringify({
        language: 'en',
        fontFamily: 'roboto',
        fontSize: 92,
        interfaceScale: 108,
        showTooltipTags: false,
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
