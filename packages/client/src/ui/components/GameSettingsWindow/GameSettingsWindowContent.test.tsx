import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_GRAPHICS_SETTINGS,
} from '../../../app/constants';
import { applyGraphicsPreset } from '../../../app/graphicsSettings';
import { t } from '../../../i18n';
import { GameSettingsWindowContent } from './GameSettingsWindowContent';

describe('GameSettingsWindowContent', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('confirms before resetting a specific save area', async () => {
    const onResetSaveArea = vi.fn(async () => undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    await act(async () => {
      root.render(
        <GameSettingsWindowContent
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          graphicsSettings={DEFAULT_GRAPHICS_SETTINGS}
          onResetSaveArea={onResetSaveArea}
          onSave={async () => undefined}
          onSaveAndReload={async () => undefined}
        />,
      );
    });

    const savesTab = Array.from(host.querySelectorAll('[role="tab"]')).find(
      (candidate) =>
        candidate.textContent?.includes(t('ui.settings.tabs.saves')),
    );
    expect(savesTab).toBeDefined();

    await act(async () => {
      savesTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const resetButton = host.querySelector(
      '[data-save-area="game"] button',
    ) as HTMLButtonElement | null;
    expect(resetButton).not.toBeNull();

    await act(async () => {
      resetButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(confirmSpy).toHaveBeenCalledWith(
      t('ui.settings.saves.confirm', {
        area: t('ui.settings.saves.areas.game.label'),
      }),
    );
    expect(onResetSaveArea).toHaveBeenCalledWith('game');
    confirmSpy.mockRestore();
  });

  it('cancels a save reset when the confirmation prompt is rejected', async () => {
    const onResetSaveArea = vi.fn(async () => undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    await act(async () => {
      root.render(
        <GameSettingsWindowContent
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          graphicsSettings={DEFAULT_GRAPHICS_SETTINGS}
          onResetSaveArea={onResetSaveArea}
          onSave={async () => undefined}
          onSaveAndReload={async () => undefined}
        />,
      );
    });

    const savesTab = Array.from(host.querySelectorAll('[role="tab"]')).find(
      (candidate) =>
        candidate.textContent?.includes(t('ui.settings.tabs.saves')),
    );

    await act(async () => {
      savesTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const resetButton = host.querySelector(
      '[data-save-area="ui"] button',
    ) as HTMLButtonElement | null;
    expect(resetButton).not.toBeNull();

    await act(async () => {
      resetButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(confirmSpy).toHaveBeenCalled();
    expect(onResetSaveArea).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('updates the music volume slider without reading a cleared event target', async () => {
    await act(async () => {
      root.render(
        <GameSettingsWindowContent
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          graphicsSettings={DEFAULT_GRAPHICS_SETTINGS}
          onResetSaveArea={async () => undefined}
          onSave={async () => undefined}
          onSaveAndReload={async () => undefined}
        />,
      );
    });

    const audioTab = Array.from(host.querySelectorAll('[role="tab"]')).find(
      (candidate) =>
        candidate.textContent?.includes(t('ui.settings.tabs.audio')),
    );

    expect(audioTab).toBeDefined();

    await act(async () => {
      audioTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const musicVolumeContainer = Array.from(
      host.querySelectorAll('label'),
    ).find((candidate) =>
      candidate.textContent?.includes(t('ui.settings.audio.musicVolume.label')),
    );
    const musicVolumeSlider = musicVolumeContainer?.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement | null;
    const volumeValue = Array.from(host.querySelectorAll('span')).find(
      (candidate) => candidate.textContent === '30%',
    );

    expect(musicVolumeSlider).not.toBeNull();
    expect(volumeValue).toBeDefined();

    await act(async () => {
      if (musicVolumeSlider) {
        const setValue = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value',
        )?.set;

        setValue?.call(musicVolumeSlider, '65');
        musicVolumeSlider.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    expect(musicVolumeSlider?.value).toBe('65');
    expect(host.textContent).toContain('65%');
  });

  it('saves sound effect toggles inside the audio payload', async () => {
    const onSave = vi.fn(async () => undefined);

    await act(async () => {
      root.render(
        <GameSettingsWindowContent
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          graphicsSettings={DEFAULT_GRAPHICS_SETTINGS}
          onResetSaveArea={async () => undefined}
          onSave={onSave}
          onSaveAndReload={async () => undefined}
        />,
      );
    });

    const audioTab = Array.from(host.querySelectorAll('[role="tab"]')).find(
      (candidate) =>
        candidate.textContent?.includes(t('ui.settings.tabs.audio')),
    );

    await act(async () => {
      audioTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const windowOpenSwitch = Array.from(host.querySelectorAll('label'))
      .find((candidate) =>
        candidate.textContent?.includes(
          t('ui.settings.audio.soundEffects.pop.label'),
        ),
      )
      ?.querySelector('input[type="checkbox"]');
    const saveButton = Array.from(host.querySelectorAll('button')).find(
      (candidate) =>
        candidate.textContent?.includes(t('ui.settings.actions.save')),
    );

    expect(windowOpenSwitch).toBeDefined();
    expect(saveButton).toBeDefined();

    await act(async () => {
      windowOpenSwitch?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    await act(async () => {
      saveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSave).toHaveBeenCalledWith({
      audio: {
        ...DEFAULT_AUDIO_SETTINGS,
        soundEffects: {
          ...DEFAULT_AUDIO_SETTINGS.soundEffects,
          pop: false,
        },
      },
      graphics: DEFAULT_GRAPHICS_SETTINGS,
    });
  });

  it('saves the music mute toggle inside the audio payload', async () => {
    const onSave = vi.fn(async () => undefined);

    await act(async () => {
      root.render(
        <GameSettingsWindowContent
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          graphicsSettings={DEFAULT_GRAPHICS_SETTINGS}
          onResetSaveArea={async () => undefined}
          onSave={onSave}
          onSaveAndReload={async () => undefined}
        />,
      );
    });

    const audioTab = Array.from(host.querySelectorAll('[role="tab"]')).find(
      (candidate) =>
        candidate.textContent?.includes(t('ui.settings.tabs.audio')),
    );

    await act(async () => {
      audioTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const musicMuteSwitch = Array.from(host.querySelectorAll('label'))
      .find((candidate) =>
        candidate.textContent?.includes(
          t('ui.settings.audio.musicMuted.label'),
        ),
      )
      ?.querySelector('input[type="checkbox"]');
    const saveButton = Array.from(host.querySelectorAll('button')).find(
      (candidate) =>
        candidate.textContent?.includes(t('ui.settings.actions.save')),
    );

    expect(musicMuteSwitch).toBeDefined();
    expect(saveButton).toBeDefined();

    await act(async () => {
      musicMuteSwitch?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    await act(async () => {
      saveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSave).toHaveBeenCalledWith({
      audio: {
        ...DEFAULT_AUDIO_SETTINGS,
        musicMuted: true,
      },
      graphics: DEFAULT_GRAPHICS_SETTINGS,
    });
  });

  it('applies the selected graphics preset to the saved payload', async () => {
    const onSave = vi.fn(async () => undefined);

    await act(async () => {
      root.render(
        <GameSettingsWindowContent
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          graphicsSettings={DEFAULT_GRAPHICS_SETTINGS}
          onResetSaveArea={async () => undefined}
          onSave={onSave}
          onSaveAndReload={async () => undefined}
        />,
      );
    });

    const performancePreset = Array.from(
      host.querySelectorAll('[role="radio"]'),
    ).find((candidate) =>
      candidate.textContent?.includes(
        t('ui.settings.graphics.preset.performance.label'),
      ),
    );
    const saveButton = Array.from(host.querySelectorAll('button')).find(
      (candidate) =>
        candidate.textContent?.includes(t('ui.settings.actions.save')),
    );

    expect(performancePreset).toBeDefined();
    expect(saveButton).toBeDefined();

    await act(async () => {
      performancePreset?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    await act(async () => {
      saveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSave).toHaveBeenCalledWith({
      audio: DEFAULT_AUDIO_SETTINGS,
      graphics: applyGraphicsPreset('performance'),
    });
  });

  it('saves the selected Pixi render FPS inside the graphics payload', async () => {
    const onSave = vi.fn(async () => undefined);

    await act(async () => {
      root.render(
        <GameSettingsWindowContent
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          graphicsSettings={DEFAULT_GRAPHICS_SETTINGS}
          onResetSaveArea={async () => undefined}
          onSave={onSave}
          onSaveAndReload={async () => undefined}
        />,
      );
    });

    const renderFpsSlider = host.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement | null;
    const saveButton = Array.from(host.querySelectorAll('button')).find(
      (candidate) =>
        candidate.textContent?.includes(t('ui.settings.actions.save')),
    );

    expect(renderFpsSlider).not.toBeNull();
    expect(saveButton).toBeDefined();

    await act(async () => {
      if (renderFpsSlider) {
        const setValue = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value',
        )?.set;

        setValue?.call(renderFpsSlider, '120');
        renderFpsSlider.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await act(async () => {
      saveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSave).toHaveBeenCalledWith({
      audio: DEFAULT_AUDIO_SETTINGS,
      graphics: {
        ...DEFAULT_GRAPHICS_SETTINGS,
        preset: 'custom',
        worldRenderFps: 120,
      },
    });
  });

  it('saves the terrain background toggle inside the graphics payload', async () => {
    const onSave = vi.fn(async () => undefined);

    await act(async () => {
      root.render(
        <GameSettingsWindowContent
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          graphicsSettings={DEFAULT_GRAPHICS_SETTINGS}
          onResetSaveArea={async () => undefined}
          onSave={onSave}
          onSaveAndReload={async () => undefined}
        />,
      );
    });

    const terrainBackgroundsSwitch = Array.from(host.querySelectorAll('label'))
      .find((candidate) =>
        candidate.textContent?.includes(
          t('ui.settings.graphics.showTerrainBackgrounds.label'),
        ),
      )
      ?.querySelector('input[type="checkbox"]');
    const saveButton = Array.from(host.querySelectorAll('button')).find(
      (candidate) =>
        candidate.textContent?.includes(t('ui.settings.actions.save')),
    );

    expect(terrainBackgroundsSwitch).toBeDefined();
    expect(saveButton).toBeDefined();

    await act(async () => {
      terrainBackgroundsSwitch?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    await act(async () => {
      saveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSave).toHaveBeenCalledWith({
      audio: DEFAULT_AUDIO_SETTINGS,
      graphics: {
        ...DEFAULT_GRAPHICS_SETTINGS,
        preset: 'custom',
        showTerrainBackgrounds: false,
      },
    });
  });

  it('marks renderer initialization graphics toggles as reload-required', async () => {
    await act(async () => {
      root.render(
        <GameSettingsWindowContent
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          graphicsSettings={DEFAULT_GRAPHICS_SETTINGS}
          onResetSaveArea={async () => undefined}
          onSave={async () => undefined}
          onSaveAndReload={async () => undefined}
        />,
      );
    });

    const reloadRequired = t('ui.settings.graphics.reloadRequired');
    const antialiasLabel = Array.from(host.querySelectorAll('label')).find(
      (candidate) =>
        candidate.textContent?.includes(
          t('ui.settings.graphics.antialias.label'),
        ),
    );
    const terrainBackgroundsLabel = Array.from(
      host.querySelectorAll('label'),
    ).find((candidate) =>
      candidate.textContent?.includes(
        t('ui.settings.graphics.showTerrainBackgrounds.label'),
      ),
    );

    expect(antialiasLabel?.textContent).toContain(reloadRequired);
    expect(terrainBackgroundsLabel?.textContent).not.toContain(reloadRequired);
  });

  it('saves selected voice actor and event toggles inside the audio payload', async () => {
    const onSave = vi.fn(async () => undefined);

    await act(async () => {
      root.render(
        <GameSettingsWindowContent
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          graphicsSettings={DEFAULT_GRAPHICS_SETTINGS}
          onResetSaveArea={async () => undefined}
          onSave={onSave}
          onSaveAndReload={async () => undefined}
        />,
      );
    });

    const audioTab = Array.from(host.querySelectorAll('[role="tab"]')).find(
      (candidate) =>
        candidate.textContent?.includes(t('ui.settings.tabs.audio')),
    );

    await act(async () => {
      audioTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const actorSelect = host.querySelector('select');
    const combatAttackSwitch = Array.from(host.querySelectorAll('label'))
      .find((candidate) =>
        candidate.textContent?.includes(
          t('ui.settings.audio.voice.events.combatAttack.label'),
        ),
      )
      ?.querySelector('input[type="checkbox"]');
    const saveButton = Array.from(host.querySelectorAll('button')).find(
      (candidate) =>
        candidate.textContent?.includes(t('ui.settings.actions.save')),
    );

    expect(actorSelect).not.toBeNull();
    expect(combatAttackSwitch).toBeDefined();
    expect(saveButton).toBeDefined();

    await act(async () => {
      if (actorSelect) {
        const setValue = Object.getOwnPropertyDescriptor(
          HTMLSelectElement.prototype,
          'value',
        )?.set;

        setValue?.call(actorSelect, 'karen-cenon');
        actorSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await act(async () => {
      combatAttackSwitch?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    await act(async () => {
      saveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSave).toHaveBeenCalledWith({
      audio: {
        ...DEFAULT_AUDIO_SETTINGS,
        voice: {
          actorId: 'karen-cenon',
          events: {
            ...DEFAULT_AUDIO_SETTINGS.voice.events,
            combatAttack: false,
          },
        },
      },
      graphics: DEFAULT_GRAPHICS_SETTINGS,
    });
  });

  it('updates the voice actor select without reading a cleared event target', async () => {
    await act(async () => {
      root.render(
        <GameSettingsWindowContent
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          graphicsSettings={DEFAULT_GRAPHICS_SETTINGS}
          onResetSaveArea={async () => undefined}
          onSave={async () => undefined}
          onSaveAndReload={async () => undefined}
        />,
      );
    });

    const audioTab = Array.from(host.querySelectorAll('[role="tab"]')).find(
      (candidate) =>
        candidate.textContent?.includes(t('ui.settings.tabs.audio')),
    );

    await act(async () => {
      audioTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const actorSelect = host.querySelector(
      'select',
    ) as HTMLSelectElement | null;

    expect(actorSelect).not.toBeNull();
    expect(actorSelect?.value).toBe(DEFAULT_AUDIO_SETTINGS.voice.actorId);

    await act(async () => {
      if (actorSelect) {
        const setValue = Object.getOwnPropertyDescriptor(
          HTMLSelectElement.prototype,
          'value',
        )?.set;

        setValue?.call(actorSelect, 'karen-cenon');
        actorSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    expect(actorSelect?.value).toBe('karen-cenon');
  });
});
