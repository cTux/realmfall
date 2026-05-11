import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createGame } from '@realmfall/core/game/stateFactory';
import { getActiveWorld } from '@realmfall/core/game/dungeons/worldState';
import { getCurrentWorldRevealRadius } from '@realmfall/core/game/stateOutposts';
import type { HexCoord } from '@realmfall/core/game/stateTypes';
import {
  DEFAULT_UI_AUDIO_CONTROLLER,
  UiAudioProvider,
} from '../../audio/UiAudioContext';
import { DEFAULT_AUDIO_SETTINGS } from '../../audioSettings';
import type {
  AppShellHomeIndicatorState,
  AppShellVoicePlaybackState,
} from '../AppShell.types';
import type { AppWindowsProps } from '../AppWindows.types';
import { AppAudioBridgeLayer, AppShell } from './AppShellTestkit';

const homeIndicatorRenderMock = vi.hoisted(() => vi.fn());
vi.mock('../HomeIndicator', () => ({
  HomeIndicator: (props: unknown) => {
    homeIndicatorRenderMock(props);
    return <div data-testid="home-indicator">home</div>;
  },
}));

vi.mock('../AppWindows', () => ({
  AppWindows: () => <div data-testid="app-windows">windows</div>,
}));

vi.mock('./VersionStatusPanel', () => ({
  VersionStatusPanel: () => <div data-testid="version-status">version</div>,
}));

vi.mock('../../audio/UiAudioControllerBridge', () => ({
  UiAudioControllerBridge: () => (
    <div data-testid="ui-audio-controller-bridge">ui-audio-controller</div>
  ),
}));

const voiceAudioBridgeRenderMock = vi.hoisted(() => vi.fn());
vi.mock('../../audio/VoiceAudioControllerBridge', () => ({
  VoiceAudioControllerBridge: (props: unknown) => {
    voiceAudioBridgeRenderMock(props);
    return <div data-testid="voice-audio-bridge">voice-audio-controller</div>;
  },
}));

vi.mock('../../audio/BackgroundMusicControllerBridge', () => ({
  BackgroundMusicControllerBridge: () => (
    <div data-testid="background-music-controller-bridge">
      background-music-controller
    </div>
  ),
}));

const useAudioBridgeActivationMock = vi.hoisted(() => vi.fn());
vi.mock('./useAudioBridgeActivation', () => ({
  useAudioBridgeActivation: useAudioBridgeActivationMock,
}));

const DEFAULT_INTERFACE_SETTINGS = {
  language: 'en' as const,
  fontFamily: 'ubuntu' as const,
  fontSize: 118,
  interfaceScale: 126,
  showTooltipTags: true,
  windowTransparency: 45,
};
const NOOP = () => undefined;

function createWindowsProps() {
  return {
    actions: {
      tooltip: {
        onCloseTooltip: () => undefined,
        onShowTooltip: () => undefined,
      },
    },
  } as unknown as AppWindowsProps;
}

function createShellState(seed: string): {
  homeIndicatorState: AppShellHomeIndicatorState;
  voicePlaybackState: AppShellVoicePlaybackState;
} {
  const game = createGame(2, seed);
  const activeWorld = getActiveWorld({
    activeWorldId: game.activeWorldId,
    worlds: game.worlds,
  });

  return {
    homeIndicatorState: {
      currentWorldKind: activeWorld?.kind ?? 'surface',
      dungeonExitHex:
        activeWorld?.kind === 'dungeon'
          ? activeWorld.dungeon.entranceCoord
          : null,
      homeHex: game.homeHex,
      playerCoord: game.player.coord,
      radius: game.radius,
      visibleRadius: getCurrentWorldRevealRadius(game),
    },
    voicePlaybackState: {
      combat: game.combat,
      logSequence: game.logSequence,
      logs: game.logs,
      player: {
        hp: game.player.hp,
        statusEffects: game.player.statusEffects,
      },
    },
  };
}

async function renderShellScene({
  root,
  audioSettings = DEFAULT_AUDIO_SETTINGS,
  claimedHex = null,
  homeIndicatorState,
  hostRef,
  interfaceSettings = DEFAULT_INTERFACE_SETTINGS,
  isReady = true,
  onUiAudioChange = () => undefined,
  onRetryPixiWorld = NOOP,
  paused = false,
  pixiWorldError = false,
  voicePlaybackState,
  windowsProps = createWindowsProps(),
}: {
  root: Root;
  audioSettings?: typeof DEFAULT_AUDIO_SETTINGS;
  claimedHex?: HexCoord | null;
  homeIndicatorState: AppShellHomeIndicatorState;
  hostRef: { current: HTMLDivElement | null };
  interfaceSettings?: typeof DEFAULT_INTERFACE_SETTINGS;
  isReady?: boolean;
  onUiAudioChange?: () => void;
  onRetryPixiWorld?: () => void;
  paused?: boolean;
  pixiWorldError?: boolean;
  voicePlaybackState: AppShellVoicePlaybackState;
  windowsProps?: AppWindowsProps;
}) {
  const shell: ReactNode = (
    <UiAudioProvider value={DEFAULT_UI_AUDIO_CONTROLLER}>
      <AppAudioBridgeLayer
        audioSettings={audioSettings}
        backgroundMusicMood="ambient"
        onUiAudioChange={onUiAudioChange}
        voicePlaybackState={voicePlaybackState}
      />
      <AppShell
        claimedHex={claimedHex}
        homeIndicatorState={homeIndicatorState}
        hostRef={hostRef}
        interfaceSettings={interfaceSettings}
        isReady={isReady}
        pixiWorldError={pixiWorldError}
        paused={paused}
        windowsProps={windowsProps}
        onRetryPixiWorld={onRetryPixiWorld}
      />
    </UiAudioProvider>
  );

  await act(async () => {
    root.render(shell);
  });

  await vi.dynamicImportSettled();
}

describe('AppShell', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    homeIndicatorRenderMock.mockClear();
    useAudioBridgeActivationMock.mockReturnValue(true);
    voiceAudioBridgeRenderMock.mockClear();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('keeps the map viewport outside the scaled UI shell and applies the interface variables', async () => {
    const hostRef = { current: null as HTMLDivElement | null };
    const shellState = createShellState('app-shell-interface-scale');

    await renderShellScene({
      root,
      homeIndicatorState: shellState.homeIndicatorState,
      hostRef,
      voicePlaybackState: shellState.voicePlaybackState,
    });

    const appRoot = host.querySelector('[class*="appRoot"]') as HTMLElement;
    const mapViewport = host.querySelector('[class*="mapViewport"]');
    const uiShell = host.querySelector('[class*="uiShell"]') as HTMLElement;

    expect(appRoot.style.getPropertyValue('--app-window-opacity')).toBe('0.55');
    expect(appRoot.style.getPropertyValue('--app-ui-font-scale')).toBe('1.18');
    expect(appRoot.style.getPropertyValue('--app-ui-scale')).toBe('1.26');
    expect(uiShell.contains(mapViewport)).toBe(false);
  });

  it('does not mount the recorded voice bridge when voice playback is disabled', async () => {
    const hostRef = { current: null as HTMLDivElement | null };
    const shellState = createShellState('app-shell-recorded-voice-disabled');

    await renderShellScene({
      root,
      audioSettings: {
        ...DEFAULT_AUDIO_SETTINGS,
        muted: true,
        voiceVolume: 0,
        voice: {
          ...DEFAULT_AUDIO_SETTINGS.voice,
          events: {
            combatAttack: false,
            combatEnd: false,
            combatExertion: false,
            playerDamaged: false,
            playerDeath: false,
          },
        },
      },
      homeIndicatorState: shellState.homeIndicatorState,
      hostRef,
      voicePlaybackState: shellState.voicePlaybackState,
    });

    expect(host.querySelector('[data-testid="voice-audio-bridge"]')).toBeNull();
    expect(
      host.querySelector('[data-testid="background-music-controller-bridge"]'),
    ).not.toBeNull();
  });

  it('keeps home-indicator renders stable for voice playback updates while preserving home-indicator updates', async () => {
    const hostRef = { current: null as HTMLDivElement | null };
    const initialState = createShellState('app-shell-voice-rerender-isolation');
    const onRetryPixiWorld = () => undefined;
    const windowsProps = createWindowsProps();

    await renderShellScene({
      root,
      homeIndicatorState: initialState.homeIndicatorState,
      hostRef,
      onRetryPixiWorld,
      voicePlaybackState: initialState.voicePlaybackState,
      windowsProps,
    });

    expect(homeIndicatorRenderMock).toHaveBeenCalledTimes(1);
    expect(voiceAudioBridgeRenderMock).toHaveBeenCalledTimes(1);

    const voiceOnlyState: AppShellVoicePlaybackState = {
      ...initialState.voicePlaybackState,
      logSequence: initialState.voicePlaybackState.logSequence + 1,
      player: {
        ...initialState.voicePlaybackState.player,
        hp: initialState.voicePlaybackState.player.hp - 1,
      },
    };

    await renderShellScene({
      root,
      homeIndicatorState: initialState.homeIndicatorState,
      hostRef,
      onRetryPixiWorld,
      voicePlaybackState: voiceOnlyState,
      windowsProps,
    });

    expect(homeIndicatorRenderMock).toHaveBeenCalledTimes(1);
    expect(voiceAudioBridgeRenderMock).toHaveBeenCalledTimes(2);
    expect(voiceAudioBridgeRenderMock.mock.lastCall?.[0]).toMatchObject({
      voicePlaybackState: {
        logSequence: voiceOnlyState.logSequence,
        player: {
          hp: voiceOnlyState.player.hp,
          statusEffects: voiceOnlyState.player.statusEffects,
        },
      },
    });

    const nextHomeIndicatorState: AppShellHomeIndicatorState = {
      ...initialState.homeIndicatorState,
      playerCoord: {
        q: initialState.homeIndicatorState.playerCoord.q + 1,
        r: initialState.homeIndicatorState.playerCoord.r,
      },
    };

    await renderShellScene({
      root,
      homeIndicatorState: nextHomeIndicatorState,
      hostRef,
      onRetryPixiWorld,
      voicePlaybackState: voiceOnlyState,
      windowsProps,
    });

    expect(homeIndicatorRenderMock).toHaveBeenCalledTimes(2);
    expect(homeIndicatorRenderMock.mock.lastCall?.[0]).toMatchObject({
      playerCoord: nextHomeIndicatorState.playerCoord,
    });
  });
});
