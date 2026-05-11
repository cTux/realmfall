import type { MockInstance } from 'vitest';
import { expect, vi } from 'vitest';
import type { AudioSettings } from '../../../../app/audioSettings';
import type { InterfaceSettings } from '../../../../app/interfaceSettings';
import { GameSettingsWindowContentTestkit } from './GameSettingsWindowContentTestkit';
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_INTERFACE_SETTINGS,
} from './utils/defaults';

const reorderAudioSettings = (settings: AudioSettings): AudioSettings => ({
  voice: {
    events: {
      playerDeath: settings.voice.events.playerDeath,
      playerDamaged: settings.voice.events.playerDamaged,
      combatExertion: settings.voice.events.combatExertion,
      combatEnd: settings.voice.events.combatEnd,
      combatAttack: settings.voice.events.combatAttack,
    },
    actorId: settings.voice.actorId,
  },
  theme: settings.theme,
  voiceVolume: settings.voiceVolume,
  uiVolume: settings.uiVolume,
  musicVolume: settings.musicVolume,
  soundEffects: {
    warning: settings.soundEffects.warning,
    toggle: settings.soundEffects.toggle,
    swoosh: settings.soundEffects.swoosh,
    success: settings.soundEffects.success,
    pop: settings.soundEffects.pop,
    notify: settings.soundEffects.notify,
    hover: settings.soundEffects.hover,
    error: settings.soundEffects.error,
    click: settings.soundEffects.click,
  },
  respectReducedMotion: settings.respectReducedMotion,
  muted: settings.muted,
  musicMuted: settings.musicMuted,
});

const reorderInterfaceSettings = (
  settings: InterfaceSettings,
): InterfaceSettings => ({
  windowTransparency: settings.windowTransparency,
  showTooltipTags: settings.showTooltipTags,
  interfaceScale: settings.interfaceScale,
  fontSize: settings.fontSize,
  fontFamily: settings.fontFamily,
  language: settings.language,
});

const isSerializedSettingsObject = (value: unknown) =>
  value !== null &&
  typeof value === 'object' &&
  (('worldRenderFps' in value && 'resolutionCap' in value) ||
    ('soundEffects' in value && 'voice' in value) ||
    ('windowTransparency' in value && 'fontSize' in value) ||
    ('autoLoot' in value && 'autoGatherResources' in value));

const expectNoSettingsStringification = (
  stringifySpy: MockInstance<typeof JSON.stringify>,
) => {
  expect(
    stringifySpy.mock.calls.filter(([value]) =>
      isSerializedSettingsObject(value),
    ).length,
  ).toBe(0);
};

describe('GameSettingsWindowContent dirty state', () => {
  let testkit: GameSettingsWindowContentTestkit;
  let stringifySpy: MockInstance<typeof JSON.stringify>;

  beforeEach(() => {
    stringifySpy = vi.spyOn(JSON, 'stringify');
    testkit = new GameSettingsWindowContentTestkit();
  });

  afterEach(async () => {
    stringifySpy.mockRestore();
    await testkit.restore();
  });

  it('keeps unchanged drafts clean when audio props rerender with the same values', async () => {
    await testkit.expect.saveActionsDisabled();
    expectNoSettingsStringification(stringifySpy);

    await testkit.actions.rerender({
      audioSettings: reorderAudioSettings(DEFAULT_AUDIO_SETTINGS),
    });

    await testkit.expect.saveActionsDisabled();
    expectNoSettingsStringification(stringifySpy);
  });

  it('marks the form dirty after a single graphics field changes', async () => {
    await testkit.expect.saveActionsDisabled();
    expectNoSettingsStringification(stringifySpy);

    await testkit.actions.setWorldRenderFps(120);

    await testkit.expect.saveActionsEnabled();
    expectNoSettingsStringification(stringifySpy);
  });

  it('clears dirty when interface props realign with the current draft values', async () => {
    await testkit.actions.openTab('interface');
    await testkit.actions.setInterfaceScale(126);

    await testkit.expect.saveActionsEnabled();
    expectNoSettingsStringification(stringifySpy);

    await testkit.actions.rerender({
      interfaceSettings: reorderInterfaceSettings({
        ...DEFAULT_INTERFACE_SETTINGS,
        interfaceScale: 126,
      }),
    });

    await testkit.expect.saveActionsDisabled();
    expectNoSettingsStringification(stringifySpy);
  });
});
