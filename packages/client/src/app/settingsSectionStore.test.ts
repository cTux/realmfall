import { describe, expect, it, vi } from 'vitest';

import { createSettingsSectionStore } from './settingsSectionStore';

describe('settings section store', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('loads, normalizes, saves, and clears one settings area through a shared helper', () => {
    const onSave = vi.fn();
    const onClear = vi.fn();
    const store = createSettingsSectionStore({
      areaId: 'audio',
      defaults: { muted: false, volume: 0.4 },
      normalize: (value) => {
        if (
          typeof value !== 'object' ||
          value === null ||
          typeof (value as Record<string, unknown>).muted !== 'boolean' ||
          typeof (value as Record<string, unknown>).volume !== 'number'
        ) {
          return { muted: false, volume: 0.4 };
        }

        return {
          muted: (value as Record<string, unknown>).muted as boolean,
          volume: Math.min(
            1,
            Math.max(0, (value as Record<string, unknown>).volume as number),
          ),
        };
      },
      onSave,
      onClear,
    });

    expect(store.load()).toEqual({ muted: false, volume: 0.4 });

    window.localStorage.setItem(
      'realmfall-settings-audio',
      JSON.stringify({ muted: true, volume: 3 }),
    );
    expect(store.load()).toEqual({ muted: true, volume: 1 });

    store.save({ muted: false, volume: -2 });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(
      JSON.parse(window.localStorage.getItem('realmfall-settings-audio') ?? ''),
    ).toEqual({
      muted: false,
      volume: 0,
    });

    store.clear();
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('realmfall-settings-audio')).toBeNull();
  });
});
