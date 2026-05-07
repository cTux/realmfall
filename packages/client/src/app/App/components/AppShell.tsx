import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  type CSSProperties,
  type MutableRefObject,
} from 'react';
import { Button, LoadingSpinner } from '@realmfall/ui';
import { getActiveWorld } from '../../../game/dungeons/worldState';
import { getCurrentWorldRevealRadius } from '../../../game/stateOutposts';
import type { GameState, HexCoord } from '../../../game/stateTypes';
import { t } from '../../../i18n';
import { recordStartupMark } from '../../../performance/performanceHarness';
import type { BackgroundMusicMood } from '../../audio/backgroundMusic';
import {
  UiAudioProvider,
  type UiAudioController,
} from '../../audio/UiAudioContext';
import type { AudioSettings } from '../../audioSettings';
import { applyInterfaceFontFamily } from '../../interfaceFonts';
import type { InterfaceSettings } from '../../interfaceSettings';
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
  interfaceSettings,
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
  interfaceSettings: InterfaceSettings;
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
  useEffect(() => {
    applyInterfaceFontFamily(interfaceSettings.fontFamily);
  }, [interfaceSettings.fontFamily]);

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
  const activeWorld = useMemo(
    () =>
      getActiveWorld({
        activeWorldId: game.activeWorldId,
        worlds: game.worlds,
      }),
    [game.activeWorldId, game.worlds],
  );
  const currentWorldKind = activeWorld?.kind ?? 'surface';
  const dungeonExitHex =
    activeWorld?.kind === 'dungeon' ? activeWorld.dungeon.entranceCoord : null;
  const appRootStyle = useMemo(
    () =>
      ({
        '--app-window-opacity': `${Math.max(
          0,
          1 - interfaceSettings.windowTransparency / 100,
        )}`,
        '--app-ui-font-scale': `${interfaceSettings.fontSize / 100}`,
        '--app-ui-scale': `${interfaceSettings.interfaceScale / 100}`,
      }) as CSSProperties,
    [
      interfaceSettings.fontSize,
      interfaceSettings.interfaceScale,
      interfaceSettings.windowTransparency,
    ],
  );

  return (
    <UiAudioProvider value={uiAudio}>
      <div className={styles.appRoot} style={appRootStyle}>
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
              currentWorldKind={currentWorldKind}
              dungeonExitHex={dungeonExitHex}
              hostRef={hostRef}
              homeHex={game.homeHex}
              playerCoord={game.player.coord}
              radius={game.radius}
              visibleRadius={getCurrentWorldRevealRadius(game)}
            />
          </Suspense>
          <div className={styles.uiShell}>
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
            {isReady ? null : (
              <div
                className={styles.loadingScreen}
                aria-live="polite"
                aria-busy={!pixiWorldError}
              >
                <div className={styles.loadingContentShell}>
                  {pixiWorldError ? (
                    <div className={styles.loadingError} role="alert">
                      <strong>{t('ui.loading.worldErrorTitle')}</strong>
                      <p>{t('ui.loading.worldErrorBody')}</p>
                      <Button unstyled type="button" onClick={onRetryPixiWorld}>
                        {t('ui.loading.worldRetryAction')}
                      </Button>
                    </div>
                  ) : (
                    <LoadingSpinner className={styles.loadingSpinner} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </UiAudioProvider>
  );
}
