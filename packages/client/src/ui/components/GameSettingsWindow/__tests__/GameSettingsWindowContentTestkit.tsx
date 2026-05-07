import { act } from 'react';
import { expect, vi, type MockInstance } from 'vitest';
import type { GraphicsPresetId } from '../../../../app/graphicsSettings';
import { t } from '../../../../i18n';
import type { ResettableSaveAreaId } from '../../../../persistence/saveAreas';
import { mountUi, settleUi } from '../../../uiTestHelpers';
import { GameSettingsWindowContent } from '../GameSettingsWindowContent';
import type {
  GameSettingsSavePayload,
  GameSettingsWindowContentProps,
} from '../types';
import {
  AUDIO_LABEL_KEYS,
  GAMEPLAY_LABEL_KEYS,
  GRAPHICS_LABEL_KEYS,
  INTERFACE_LABEL_KEYS,
  TAB_LABEL_KEYS,
} from './utils/keys';
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_GAMEPLAY_SETTINGS,
  DEFAULT_GRAPHICS_SETTINGS,
  DEFAULT_INTERFACE_SETTINGS,
  DEFAULT_SAVE_PAYLOAD,
} from './utils/defaults';
import { ensureReactActEnvironment } from './utils/environment';
import { requireElement } from './utils/dom';
import { mergeDeep } from './utils/object';
import type {
  AudioSoundEffectId,
  DeepPartial,
  GameplaySettingId,
  GraphicsSettingId,
  ImpactLevel,
  SettingsTab,
  VoiceEventId,
} from './utils/types';

export class GameSettingsWindowContentTestkit {
  readonly onResetSaveArea = vi.fn(
    async (_areaId: ResettableSaveAreaId) => undefined,
  );
  readonly onSave = vi.fn(
    async (_payload: GameSettingsSavePayload) => undefined,
  );
  readonly onSaveAndReload = vi.fn(
    async (_payload: GameSettingsSavePayload) => undefined,
  );

  private confirmSpy: MockInstance<typeof window.confirm> | null = null;
  private mountedUi: Awaited<ReturnType<typeof mountUi>> | null = null;
  private readonly ready: Promise<void>;

  constructor(overrides: Partial<GameSettingsWindowContentProps> = {}) {
    ensureReactActEnvironment();
    vi.useFakeTimers();

    const props: GameSettingsWindowContentProps = {
      audioSettings: DEFAULT_AUDIO_SETTINGS,
      gameplaySettings: DEFAULT_GAMEPLAY_SETTINGS,
      graphicsSettings: DEFAULT_GRAPHICS_SETTINGS,
      interfaceSettings: DEFAULT_INTERFACE_SETTINGS,
      onResetSaveArea: this.onResetSaveArea,
      onSave: this.onSave,
      onSaveAndReload: this.onSaveAndReload,
      ...overrides,
    };

    this.ready = mountUi(<GameSettingsWindowContent {...props} />).then(
      (ui) => {
        this.mountedUi = ui;
      },
    );
  }

  readonly mock = {
    confirmPromptAccept: async () => this.mock.confirmPromptResult(true),
    confirmPromptReject: async () => this.mock.confirmPromptResult(false),
    confirmPromptResult: async (accepted: boolean) => {
      await this.whenReady();
      this.confirmSpy?.mockRestore();
      this.confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(accepted);
    },
  };

  readonly actions = {
    chooseGraphicsPreset: async (presetId: GraphicsPresetId) => {
      await this.whenReady();
      await this.clickElement(this.findPreset(presetId));
    },
    chooseInterfaceFontFamily: async (fontFamily: string) => {
      await this.whenReady();
      await this.setSelectValue(
        this.findSelect(this.translate(INTERFACE_LABEL_KEYS.fontFamily)),
        fontFamily,
      );
    },
    chooseInterfaceLanguage: async (language: string) => {
      await this.whenReady();
      await this.setSelectValue(
        this.findSelect(this.translate(INTERFACE_LABEL_KEYS.language)),
        language,
      );
    },
    chooseVoiceActor: async (actorId: string) => {
      await this.whenReady();
      await this.setSelectValue(
        this.findSelect(this.translate(AUDIO_LABEL_KEYS.voiceActor)),
        actorId,
      );
    },
    clickDataResetFor: async (areaId: ResettableSaveAreaId) => {
      await this.whenReady();
      await this.clickElement(this.findResetButton(areaId));
    },
    openTab: async (tab: SettingsTab) => {
      await this.whenReady();
      await this.clickElement(this.findTab(tab));
    },
    save: async () => {
      await this.whenReady();
      await this.clickElement(this.findSaveButton());
    },
    saveAndReload: async () => {
      await this.whenReady();
      await this.clickElement(this.findSaveAndReloadButton());
    },
    setCloudTransparency: async (value: number) => {
      await this.whenReady();
      await this.setSliderValue(
        this.findSlider(this.translate(GRAPHICS_LABEL_KEYS.cloudTransparency)),
        value,
      );
    },
    setInterfaceFontSize: async (value: number) => {
      await this.whenReady();
      await this.setSliderValue(
        this.findSlider(this.translate(INTERFACE_LABEL_KEYS.fontSize)),
        value,
      );
    },
    setInterfaceScale: async (value: number) => {
      await this.whenReady();
      await this.setSliderValue(
        this.findSlider(this.translate(INTERFACE_LABEL_KEYS.interfaceScale)),
        value,
      );
    },
    setMusicVolume: async (value: number) => {
      await this.whenReady();
      await this.setSliderValue(
        this.findSlider(this.translate(AUDIO_LABEL_KEYS.musicVolume)),
        value,
      );
    },
    setWindowTransparency: async (value: number) => {
      await this.whenReady();
      await this.setSliderValue(
        this.findSlider(
          this.translate(INTERFACE_LABEL_KEYS.windowTransparency),
        ),
        value,
      );
    },
    setWorldRenderFps: async (value: number) => {
      await this.whenReady();
      await this.setSliderValue(
        this.findSlider(this.translate(GRAPHICS_LABEL_KEYS.worldRenderFps)),
        value,
      );
    },
    toggleAutoGatherResources: async () => {
      await this.whenReady();
      await this.clickElement(
        this.findSwitch(
          this.translate(GAMEPLAY_LABEL_KEYS.autoGatherResources),
        ),
      );
    },
    toggleAutoLoot: async () => {
      await this.whenReady();
      await this.clickElement(
        this.findSwitch(this.translate(GAMEPLAY_LABEL_KEYS.autoLoot)),
      );
    },
    toggleMusicMuted: async () => {
      await this.whenReady();
      await this.clickElement(
        this.findSwitch(this.translate(AUDIO_LABEL_KEYS.musicMuted)),
      );
    },
    toggleShowClouds: async () => {
      await this.whenReady();
      await this.clickElement(
        this.findSwitch(this.translate(GRAPHICS_LABEL_KEYS.showClouds)),
      );
    },
    toggleShowTerrainBackgrounds: async () => {
      await this.whenReady();
      await this.clickElement(
        this.findSwitch(
          this.translate(GRAPHICS_LABEL_KEYS.showTerrainBackgrounds),
        ),
      );
    },
    toggleShowTooltipTags: async () => {
      await this.whenReady();
      await this.clickElement(
        this.findSwitch(this.translate(INTERFACE_LABEL_KEYS.showTooltipTags)),
      );
    },
    toggleSoundEffect: async (effectId: AudioSoundEffectId) => {
      await this.whenReady();
      await this.clickElement(
        this.findSwitch(
          this.translate(`ui.settings.audio.soundEffects.${effectId}.label`),
        ),
      );
    },
    toggleVoiceEvent: async (eventId: VoiceEventId) => {
      await this.whenReady();
      await this.clickElement(
        this.findSwitch(
          this.translate(`ui.settings.audio.voice.events.${eventId}.label`),
        ),
      );
    },
  };

  readonly expect = {
    confirmPromptShown: async () => {
      await this.whenReady();
      expect(this.confirmSpy).not.toBeNull();
      expect(this.confirmSpy).toHaveBeenCalled();
    },
    confirmPromptShownFor: async (areaId: ResettableSaveAreaId) => {
      await this.expect.confirmPromptShown();
      expect(this.confirmSpy).toHaveBeenCalledWith(
        t('ui.settings.saves.confirm', {
          area: t(`ui.settings.saves.areas.${areaId}.label`),
        }),
      );
    },
    gameplaySettingHidden: async (settingId: GameplaySettingId) => {
      await this.whenReady();
      expect(
        this.findLabel(this.translate(GAMEPLAY_LABEL_KEYS[settingId])),
      ).toBeUndefined();
    },
    graphicsPresetImpact: async (
      presetId: GraphicsPresetId,
      impactLevel: ImpactLevel,
    ) => {
      await this.whenReady();
      expect(
        this.findPreset(presetId)?.querySelector(
          `[data-impact-level="${impactLevel}"]`,
        )?.textContent,
      ).toBe(t(`ui.settings.graphics.performanceImpact.${impactLevel}`));
    },
    graphicsSettingDoesNotRequireReload: async (
      settingId: GraphicsSettingId,
    ) => {
      await this.whenReady();
      expect(
        this.findLabel(this.translate(GRAPHICS_LABEL_KEYS[settingId]))
          ?.textContent,
      ).not.toContain(t('ui.settings.graphics.reloadRequired'));
    },
    graphicsSettingImpact: async (
      settingId: GraphicsSettingId,
      impactLevel: ImpactLevel,
    ) => {
      await this.whenReady();
      expect(
        this.findLabel(
          this.translate(GRAPHICS_LABEL_KEYS[settingId]),
        )?.querySelector(`[data-impact-level="${impactLevel}"]`)?.textContent,
      ).toBe(t(`ui.settings.graphics.performanceImpact.${impactLevel}`));
    },
    graphicsSettingRequiresReload: async (settingId: GraphicsSettingId) => {
      await this.whenReady();
      expect(
        this.findLabel(this.translate(GRAPHICS_LABEL_KEYS[settingId]))
          ?.textContent,
      ).toContain(t('ui.settings.graphics.reloadRequired'));
    },
    interfaceLanguageEquals: async (language: string) => {
      await this.whenReady();
      expect(
        this.findSelect(this.translate(INTERFACE_LABEL_KEYS.language))?.value,
      ).toBe(language);
    },
    interfaceLanguageOptionsEqual: async (expectedOptions: string[]) => {
      await this.whenReady();
      const select = requireElement(
        this.findSelect(this.translate(INTERFACE_LABEL_KEYS.language)),
        'Expected language select.',
      );

      expect(Array.from(select.options).map((option) => option.value)).toEqual(
        expectedOptions,
      );
    },
    musicVolumeEquals: async (value: number) => {
      await this.whenReady();
      expect(
        this.findSlider(this.translate(AUDIO_LABEL_KEYS.musicVolume))?.value,
      ).toBe(String(value));
    },
    resetNotTriggeredFor: async (_areaId: ResettableSaveAreaId) => {
      await this.whenReady();
      expect(this.onResetSaveArea).not.toHaveBeenCalled();
    },
    resetTriggeredFor: async (areaId: ResettableSaveAreaId) => {
      await this.whenReady();
      expect(this.onResetSaveArea).toHaveBeenCalledWith(areaId);
    },
    savedPayloadMatches: async (
      expectedPatch: DeepPartial<GameSettingsSavePayload>,
    ) => {
      await this.whenReady();
      expect(this.onSave).toHaveBeenCalledWith(
        mergeDeep(DEFAULT_SAVE_PAYLOAD, expectedPatch),
      );
    },
    tabOrientation: async (orientation: 'horizontal' | 'vertical') => {
      await this.whenReady();
      expect(this.findTabList()?.getAttribute('aria-orientation')).toBe(
        orientation,
      );
    },
    tabsVisible: async (tabs: SettingsTab[]) => {
      await this.whenReady();
      expect(this.listTabTexts()).toEqual(
        tabs.map((tab) => this.translate(TAB_LABEL_KEYS[tab])),
      );
    },
    textContains: async (text: string) => {
      await this.whenReady();
      expect(this.hostText()).toContain(text);
    },
    voiceActorEquals: async (actorId: string) => {
      await this.whenReady();
      expect(
        this.findSelect(this.translate(AUDIO_LABEL_KEYS.voiceActor))?.value,
      ).toBe(actorId);
    },
  };

  async restore() {
    try {
      await this.ready;
    } finally {
      this.confirmSpy?.mockRestore();
      this.confirmSpy = null;

      if (this.mountedUi) {
        await this.mountedUi.unmount();
        this.mountedUi = null;
      }

      vi.useRealTimers();
    }
  }

  private async whenReady() {
    await this.ready;
    if (!this.mountedUi) {
      throw new Error('Expected mounted GameSettings window.');
    }

    return this.mountedUi;
  }

  private translate(key: string) {
    return t(key);
  }

  private async clickElement(element: Element | null | undefined) {
    const target = requireElement(element, 'Expected clickable element.');

    await act(async () => {
      target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await settleUi();
  }

  private findButton(text: string) {
    return this.queryAll('button').find(
      (button) => button.textContent === text,
    );
  }

  private findLabel(text: string) {
    return this.queryAll('label').find((label) =>
      label.textContent?.includes(text),
    );
  }

  private findPreset(presetId: string) {
    return this.host().querySelector(`#graphics-preset-${presetId}`);
  }

  private findResetButton(areaId: ResettableSaveAreaId) {
    return this.host().querySelector(
      `[data-save-area="${areaId}"] button`,
    ) as HTMLButtonElement | null;
  }

  private findSaveAndReloadButton() {
    return this.findButton(this.translate('ui.settings.actions.saveReload'));
  }

  private findSaveButton() {
    return this.findButton(this.translate('ui.settings.actions.save'));
  }

  private findSelect(label: string) {
    return this.findLabel(label)?.querySelector(
      'select',
    ) as HTMLSelectElement | null;
  }

  private findSlider(label: string) {
    return this.findLabel(label)?.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement | null;
  }

  private findSwitch(label: string) {
    return this.findLabel(label)?.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement | null;
  }

  private findTab(tab: SettingsTab) {
    return this.queryAll('[role="tab"]').find((candidate) =>
      candidate.textContent?.includes(this.translate(TAB_LABEL_KEYS[tab])),
    );
  }

  private findTabList() {
    return this.host().querySelector('[role="tablist"]');
  }

  private host() {
    return requireElement(this.mountedUi?.host, 'Expected mounted host.');
  }

  private hostText() {
    return this.host().textContent ?? '';
  }

  private listTabTexts() {
    return this.queryAll('[role="tab"]').map((tab) => tab.textContent?.trim());
  }

  private queryAll(selector: string) {
    return Array.from(this.host().querySelectorAll(selector));
  }

  private async setSelectValue(
    select: HTMLSelectElement | null | undefined,
    value: string,
  ) {
    const target = requireElement(select, `Expected select for ${value}.`);
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      'value',
    )?.set;

    await act(async () => {
      setValue?.call(target, value);
      target.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await settleUi();
  }

  private async setSliderValue(
    slider: HTMLInputElement | null | undefined,
    value: number,
  ) {
    const target = requireElement(slider, `Expected slider for ${value}.`);
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set;

    await act(async () => {
      setValue?.call(target, String(value));
      target.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settleUi();
  }
}
