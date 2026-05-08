import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DEFAULT_AUDIO_SETTINGS } from '../../audioSettings';
import { DEFAULT_UI_AUDIO_CONTROLLER } from '../../audio/UiAudioContext';
import type { AppWindowsProps } from '../AppWindows.types';
import { createGame } from '../../../game/stateFactory';
import { getCurrentWorldRevealRadius } from '../../../game/stateOutposts';
import { getActiveWorld } from '../../../game/dungeons/worldState';
import type { AppShellState } from '../AppShell.types';
import { AppShell } from './AppShellTestkit';

vi.mock('../AppWindows', () => ({
  AppWindows: () => <div data-testid="app-windows">windows</div>,
}));

vi.mock('../HomeIndicator', () => ({
  HomeIndicator: () => <div data-testid="home-indicator">home</div>,
}));

vi.mock('./VersionStatusPanel', () => ({
  VersionStatusPanel: () => <div data-testid="version-status">version</div>,
}));

vi.mock('../../audio/UiAudioControllerBridge', () => ({
  UiAudioControllerBridge: () => null,
}));

vi.mock('../../audio/VoiceAudioControllerBridge', () => ({
  VoiceAudioControllerBridge: () => null,
}));

vi.mock('../../audio/BackgroundMusicControllerBridge', () => ({
  BackgroundMusicControllerBridge: () => null,
}));

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
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('keeps the map viewport outside the scaled UI shell and applies the interface variables', async () => {
    const hostRef = { current: null as HTMLDivElement | null };
    const windowsProps = {
      actions: {
        tooltip: {
          onCloseTooltip: () => undefined,
          onShowTooltip: () => undefined,
        },
      },
    } as unknown as AppWindowsProps;

    const game = createGame(2, 'app-shell-interface-scale');
    const activeWorld = getActiveWorld({
      activeWorldId: game.activeWorldId,
      worlds: game.worlds,
    });
    const shellState: AppShellState = {
      homeIndicator: {
        currentWorldKind: activeWorld?.kind ?? 'surface',
        dungeonExitHex:
          activeWorld?.kind === 'dungeon' ? activeWorld.dungeon.entranceCoord : null,
        homeHex: game.homeHex,
        playerCoord: game.player.coord,
        radius: game.radius,
        visibleRadius: getCurrentWorldRevealRadius(game),
      },
      voicePlayback: {
        combat: game.combat,
        logSequence: game.logSequence,
        logs: game.logs,
        player: {
          hp: game.player.hp,
          statusEffects: game.player.statusEffects,
        },
      },
    };

    await act(async () => {
      root.render(
        <AppShell
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          backgroundMusicMood="ambient"
          claimedHex={null}
          shellState={shellState}
          hostRef={hostRef}
          interfaceSettings={{
            language: 'en',
            fontFamily: 'ubuntu',
            fontSize: 118,
            interfaceScale: 126,
            showTooltipTags: true,
            windowTransparency: 45,
          }}
          isReady
          pixiWorldError={false}
          paused={false}
          uiAudio={DEFAULT_UI_AUDIO_CONTROLLER}
          windowsProps={windowsProps}
          onRetryPixiWorld={() => undefined}
          onUiAudioChange={() => undefined}
        />,
      );
    });

    await vi.dynamicImportSettled();

    const appRoot = host.querySelector('[class*="appRoot"]') as HTMLElement;
    const mapViewport = host.querySelector('[class*="mapViewport"]');
    const uiShell = host.querySelector('[class*="uiShell"]') as HTMLElement;

    expect(appRoot.style.getPropertyValue('--app-window-opacity')).toBe('0.55');
    expect(appRoot.style.getPropertyValue('--app-ui-font-scale')).toBe('1.18');
    expect(appRoot.style.getPropertyValue('--app-ui-scale')).toBe('1.26');
    expect(uiShell.contains(mapViewport)).toBe(false);
  });
});
