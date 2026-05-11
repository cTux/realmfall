import { useEffect, useState } from 'react';
import { Button } from '@realmfall/ui-react/button';
import { type AudioSettings } from '../../../app/audioSettings';
import { type GameplaySettings } from '../../../app/gameplaySettings';
import {
  deriveGraphicsPreset,
  type GraphicsSettings,
} from '../../../app/graphicsSettings';
import { type InterfaceSettings } from '../../../app/interfaceSettings';
import type { ResettableSaveAreaId } from '../../../persistence/saveAreas';
import { t } from '../../../i18n';
import { GameSettingsAudioPanel } from './GameSettingsAudioPanel';
import { GameSettingsGameplayPanel } from './GameSettingsGameplayPanel';
import { GameSettingsGraphicsPanel } from './GameSettingsGraphicsPanel';
import { GameSettingsInterfacePanel } from './GameSettingsInterfacePanel';
import { GameSettingsSavesPanel } from './GameSettingsSavesPanel';
import type {
  GameSettingsWindowContentProps,
  UpdateGameplaySettings,
  UpdateAudioSettings,
  UpdateGraphicsSettings,
  UpdateInterfaceSettings,
} from './types';
import styles from './styles.module.scss';

const TAB_ORDER = [
  'graphics',
  'audio',
  'interface',
  'gameplay',
  'saves',
] as const;

type SettingsTabId = (typeof TAB_ORDER)[number];

type BusyAction =
  | { kind: 'save' }
  | { kind: 'saveReload' }
  | { areaId: ResettableSaveAreaId; kind: 'reset' }
  | null;

const areGraphicsSettingsEqual = (
  left: GraphicsSettings,
  right: GraphicsSettings,
) =>
  left.preset === right.preset &&
  left.resolutionCap === right.resolutionCap &&
  left.worldRenderFps === right.worldRenderFps &&
  left.showClouds === right.showClouds &&
  left.cloudTransparency === right.cloudTransparency &&
  left.antialias === right.antialias &&
  left.autoDensity === right.autoDensity &&
  left.clearBeforeRender === right.clearBeforeRender &&
  left.preserveDrawingBuffer === right.preserveDrawingBuffer &&
  left.premultipliedAlpha === right.premultipliedAlpha &&
  left.showTerrainBackgrounds === right.showTerrainBackgrounds &&
  left.useContextAlpha === right.useContextAlpha;

const areAudioSoundEffectsEqual = (
  left: AudioSettings['soundEffects'],
  right: AudioSettings['soundEffects'],
) =>
  left.click === right.click &&
  left.error === right.error &&
  left.hover === right.hover &&
  left.notify === right.notify &&
  left.pop === right.pop &&
  left.success === right.success &&
  left.swoosh === right.swoosh &&
  left.toggle === right.toggle &&
  left.warning === right.warning;

const areAudioVoiceEventsEqual = (
  left: AudioSettings['voice']['events'],
  right: AudioSettings['voice']['events'],
) =>
  left.combatAttack === right.combatAttack &&
  left.combatEnd === right.combatEnd &&
  left.combatExertion === right.combatExertion &&
  left.playerDamaged === right.playerDamaged &&
  left.playerDeath === right.playerDeath;

const areAudioVoiceSettingsEqual = (
  left: AudioSettings['voice'],
  right: AudioSettings['voice'],
) =>
  left.actorId === right.actorId &&
  areAudioVoiceEventsEqual(left.events, right.events);

const areAudioSettingsEqual = (left: AudioSettings, right: AudioSettings) =>
  left.musicMuted === right.musicMuted &&
  left.muted === right.muted &&
  left.respectReducedMotion === right.respectReducedMotion &&
  areAudioSoundEffectsEqual(left.soundEffects, right.soundEffects) &&
  left.musicVolume === right.musicVolume &&
  left.uiVolume === right.uiVolume &&
  left.voiceVolume === right.voiceVolume &&
  left.theme === right.theme &&
  areAudioVoiceSettingsEqual(left.voice, right.voice);

const areInterfaceSettingsEqual = (
  left: InterfaceSettings,
  right: InterfaceSettings,
) =>
  left.language === right.language &&
  left.fontFamily === right.fontFamily &&
  left.fontSize === right.fontSize &&
  left.interfaceScale === right.interfaceScale &&
  left.showTooltipTags === right.showTooltipTags &&
  left.windowTransparency === right.windowTransparency;

const areGameplaySettingsEqual = (
  left: GameplaySettings,
  right: GameplaySettings,
) =>
  left.autoGatherResources === right.autoGatherResources &&
  left.autoLoot === right.autoLoot;

export function GameSettingsWindowContent({
  audioSettings,
  gameplaySettings,
  graphicsSettings,
  interfaceSettings,
  onClose,
  onResetSaveArea,
  onSave,
  onSaveAndReload,
}: GameSettingsWindowContentProps) {
  const [activeTabId, setActiveTabId] = useState<SettingsTabId>('graphics');
  const [draftGraphicsSettings, setDraftGraphicsSettings] =
    useState<GraphicsSettings>(graphicsSettings);
  const [draftInterfaceSettings, setDraftInterfaceSettings] =
    useState<InterfaceSettings>(interfaceSettings);
  const [draftGameplaySettings, setDraftGameplaySettings] =
    useState<GameplaySettings>(gameplaySettings);
  const [draftAudioSettings, setDraftAudioSettings] =
    useState<AudioSettings>(audioSettings);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);

  useEffect(() => {
    setDraftGraphicsSettings(graphicsSettings);
  }, [graphicsSettings]);

  useEffect(() => {
    setDraftAudioSettings(audioSettings);
  }, [audioSettings]);

  useEffect(() => {
    setDraftInterfaceSettings(interfaceSettings);
  }, [interfaceSettings]);

  useEffect(() => {
    setDraftGameplaySettings(gameplaySettings);
  }, [gameplaySettings]);

  const dirty =
    !areGraphicsSettingsEqual(draftGraphicsSettings, graphicsSettings) ||
    !areAudioSettingsEqual(draftAudioSettings, audioSettings) ||
    !areInterfaceSettingsEqual(draftInterfaceSettings, interfaceSettings) ||
    !areGameplaySettingsEqual(draftGameplaySettings, gameplaySettings);

  const savePayload = {
    audio: draftAudioSettings,
    gameplay: draftGameplaySettings,
    graphics: draftGraphicsSettings,
    interface: draftInterfaceSettings,
  };
  const resettingAreaId =
    busyAction?.kind === 'reset' ? busyAction.areaId : null;

  const updateDraftGraphicsSettings: UpdateGraphicsSettings = (updater) => {
    setDraftGraphicsSettings((current) => {
      const nextSettings = updater(current);

      return {
        ...nextSettings,
        preset: deriveGraphicsPreset(nextSettings),
      };
    });
  };

  const updateDraftAudioSettings: UpdateAudioSettings = (updater) => {
    setDraftAudioSettings(updater);
  };

  const updateDraftInterfaceSettings: UpdateInterfaceSettings = (updater) => {
    setDraftInterfaceSettings(updater);
  };

  const updateDraftGameplaySettings: UpdateGameplaySettings = (updater) => {
    setDraftGameplaySettings(updater);
  };

  const handleResetSaveArea = async (areaId: ResettableSaveAreaId) => {
    setBusyAction({ areaId, kind: 'reset' });
    try {
      await onResetSaveArea(areaId);
    } finally {
      setBusyAction(null);
    }
  };

  const handleSave = async () => {
    setBusyAction({ kind: 'save' });
    try {
      await onSave(savePayload);
      onClose?.();
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveAndReload = async () => {
    setBusyAction({ kind: 'saveReload' });
    try {
      await onSaveAndReload(savePayload);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className={styles.layout}>
      <div className={styles.tabs} role="tablist" aria-orientation="horizontal">
        {TAB_ORDER.map((tabId) => (
          <Button
            unstyled
            key={tabId}
            id={`${tabId}-tab`}
            type="button"
            size="small"
            role="tab"
            aria-selected={activeTabId === tabId}
            aria-controls={`${tabId}-panel`}
            className={styles.tab}
            data-active={activeTabId === tabId}
            onClick={() => setActiveTabId(tabId)}
          >
            {t(`ui.settings.tabs.${tabId}`)}
          </Button>
        ))}
      </div>
      <div className={styles.content}>
        <section
          id={`${activeTabId}-panel`}
          role="tabpanel"
          aria-labelledby={`${activeTabId}-tab`}
          className={styles.tabPanel}
        >
          {activeTabId === 'graphics' ? (
            <GameSettingsGraphicsPanel
              graphicsSettings={draftGraphicsSettings}
              onChange={updateDraftGraphicsSettings}
            />
          ) : activeTabId === 'audio' ? (
            <GameSettingsAudioPanel
              audioSettings={draftAudioSettings}
              onChange={updateDraftAudioSettings}
            />
          ) : activeTabId === 'interface' ? (
            <GameSettingsInterfacePanel
              interfaceSettings={draftInterfaceSettings}
              onChange={updateDraftInterfaceSettings}
            />
          ) : activeTabId === 'gameplay' ? (
            <GameSettingsGameplayPanel
              gameplaySettings={draftGameplaySettings}
              onChange={updateDraftGameplaySettings}
            />
          ) : (
            <GameSettingsSavesPanel
              busyAreaId={resettingAreaId}
              onResetSaveArea={handleResetSaveArea}
            />
          )}
        </section>
        <div className={styles.actions}>
          <div className={styles.primaryActions}>
            <Button
              unstyled
              type="button"
              onClick={() => void handleSave()}
              disabled={busyAction !== null || !dirty}
            >
              {busyAction?.kind === 'save'
                ? t('ui.settings.actions.saving')
                : t('ui.settings.actions.save')}
            </Button>
            <Button
              unstyled
              type="button"
              onClick={() => void handleSaveAndReload()}
              disabled={busyAction !== null || !dirty}
            >
              {busyAction?.kind === 'saveReload'
                ? t('ui.settings.actions.savingReload')
                : t('ui.settings.actions.saveReload')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
