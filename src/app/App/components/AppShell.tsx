import { lazy, Suspense, useMemo, type MutableRefObject } from 'react';
import type { GameState, HexCoord } from '../../../game/stateTypes';
import { t } from '../../../i18n';
import { LoadingSpinner } from '../../../ui/components/LoadingSpinner';
import type { BackgroundMusicMood } from '../../audio/backgroundMusic';
import {
  UiAudioProvider,
  type UiAudioController,
} from '../../audio/UiAudioContext';
import type { AudioSettings } from '../../audioSettings';
import { AppWindows } from '../AppWindows';
import type { AppWindowsProps } from '../AppWindows.types';
import styles from '../styles.module.scss';
import { PauseOverlay } from './PauseOverlay';
import { useAudioBridgeActivation } from './useAudioBridgeActivation';

const UiAudioControllerBridge = lazy(() =>
  import('../../audio/UiAudioControllerBridge').then((module) => ({
    default: module.UiAudioControllerBridge,
  })),
);
const VoiceAudioControllerBridge = lazy(() =>
  import('../../audio/VoiceAudioControllerBridge').then((module) => ({
    default: module.VoiceAudioControllerBridge,
  })),
);
const BackgroundMusicControllerBridge = lazy(() =>
  import('../../audio/BackgroundMusicControllerBridge').then((module) => ({
    default: module.BackgroundMusicControllerBridge,
  })),
);
const HomeIndicator = lazy(() =>
  import('../HomeIndicator').then((module) => ({
    default: module.HomeIndicator,
  })),
);

export function AppShell({
  audioSettings,
  backgroundMusicMood,
  claimedHex,
  game,
  hostRef,
  isReady,
  paused,
  uiAudio,
  windowsProps,
  onUiAudioChange,
}: {
  audioSettings: AudioSettings;
  backgroundMusicMood: BackgroundMusicMood;
  claimedHex: HexCoord | null;
  game: GameState;
  hostRef: MutableRefObject<HTMLDivElement | null>;
  isReady: boolean;
  paused: boolean;
  uiAudio: UiAudioController;
  windowsProps: AppWindowsProps;
  onUiAudioChange: (nextController: UiAudioController) => void;
}) {
  const audioBridgeActivated = useAudioBridgeActivation();
  const { combat, logSequence, logs } = game;
  const { hp, statusEffects } = game.player;
  const voicePlaybackState = useMemo(
    () => ({
      combat,
      logSequence,
      logs,
      player: {
        hp,
        statusEffects,
      },
    }),
    [combat, hp, logSequence, logs, statusEffects],
  );

  return (
    <UiAudioProvider value={uiAudio}>
      <div className={styles.appRoot}>
        <Suspense fallback={null}>
          <UiAudioControllerBridge
            audioSettings={audioSettings}
            onChange={onUiAudioChange}
          />
          {audioBridgeActivated ? (
            <>
              <VoiceAudioControllerBridge
                audioSettings={audioSettings}
                voicePlaybackState={voicePlaybackState}
              />
              <BackgroundMusicControllerBridge
                audioSettings={audioSettings}
                mood={backgroundMusicMood}
              />
            </>
          ) : null}
        </Suspense>
        <div className={styles.appShell}>
          <div ref={hostRef} className={styles.mapViewport} />
          <Suspense fallback={null}>
            <HomeIndicator
              claimedHex={claimedHex}
              hostRef={hostRef}
              homeHex={game.homeHex}
              playerCoord={game.player.coord}
              radius={game.radius}
            />
          </Suspense>
          <AppWindows {...windowsProps} />
          {isReady && paused ? (
            <PauseOverlay
              title={t('ui.pauseOverlay.title')}
              subtitle={t('ui.pauseOverlay.subtitle')}
            />
          ) : null}
        </div>
        {isReady ? null : (
          <div
            className={styles.loadingScreen}
            aria-live="polite"
            aria-busy="true"
          >
            <LoadingSpinner className={styles.loadingSpinner} />
          </div>
        )}
      </div>
    </UiAudioProvider>
  );
}
