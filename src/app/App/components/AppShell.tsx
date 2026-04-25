import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  type MutableRefObject,
} from 'react';
import type { GameState, HexCoord } from '../../../game/stateTypes';
import { t } from '../../../i18n';
import { recordStartupMark } from '../../../performance/performanceHarness';
import { LoadingSpinner } from '../../../ui/components/LoadingSpinner';
import type { BackgroundMusicMood } from '../../audio/backgroundMusic';
import {
  UiAudioProvider,
  type UiAudioController,
} from '../../audio/UiAudioContext';
import type { AudioSettings } from '../../audioSettings';
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
const AppWindows = lazy(() =>
  import('../AppWindows').then((module) => ({
    default: module.AppWindows,
  })),
);
const HomeIndicator = lazy(() =>
  import('../HomeIndicator').then((module) => ({
    default: module.HomeIndicator,
  })),
);
const VersionStatusPanel = lazy(() =>
  import('./VersionStatusPanel').then((module) => ({
    default: module.VersionStatusPanel,
  })),
);

export function AppShell({
  audioSettings,
  backgroundMusicMood,
  claimedHex,
  game,
  hostRef,
  isReady,
  pixiWorldError,
  paused,
  uiAudio,
  windowsProps,
  onRetryPixiWorld,
  onUiAudioChange,
}: {
  audioSettings: AudioSettings;
  backgroundMusicMood: BackgroundMusicMood;
  claimedHex: HexCoord | null;
  game: GameState;
  hostRef: MutableRefObject<HTMLDivElement | null>;
  isReady: boolean;
  pixiWorldError: boolean;
  paused: boolean;
  uiAudio: UiAudioController;
  windowsProps: AppWindowsProps;
  onRetryPixiWorld: () => void;
  onUiAudioChange: (nextController: UiAudioController) => void;
}) {
  const audioBridgeActivated = useAudioBridgeActivation();
  const { combat, logSequence, logs } = game;
  const { hp, statusEffects } = game.player;
  useEffect(() => {
    if (isReady) {
      recordStartupMark('app-ready');
    }
  }, [isReady]);

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
          <Suspense fallback={null}>
            <AppWindows {...windowsProps} />
          </Suspense>
          {isReady && paused ? (
            <PauseOverlay
              title={t('ui.pauseOverlay.title')}
              subtitle={t('ui.pauseOverlay.subtitle')}
            />
          ) : null}
          <Suspense fallback={null}>
            <VersionStatusPanel
              onRefresh={() => window.location.reload()}
              onHoverDetail={windowsProps.actions.tooltip.onShowTooltip}
              onLeaveDetail={windowsProps.actions.tooltip.onCloseTooltip}
            />
          </Suspense>
        </div>
        {isReady ? null : (
          <div
            className={styles.loadingScreen}
            aria-live="polite"
            aria-busy={!pixiWorldError}
          >
            {pixiWorldError ? (
              <div className={styles.loadingError} role="alert">
                <strong>{t('ui.loading.worldErrorTitle')}</strong>
                <p>{t('ui.loading.worldErrorBody')}</p>
                <button type="button" onClick={onRetryPixiWorld}>
                  {t('ui.loading.worldRetryAction')}
                </button>
              </div>
            ) : (
              <LoadingSpinner className={styles.loadingSpinner} />
            )}
          </div>
        )}
      </div>
    </UiAudioProvider>
  );
}
