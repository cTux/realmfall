import { act } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { moveToTile, type GameState } from '../../../game/state';
import {
  createHydratedAppGame,
  flushLazyModules,
  loadEncryptedState,
  renderApp,
} from './appTestHarness';

let setGameRef: MutableRefObject<Dispatch<SetStateAction<GameState>> | null> = {
  current: null,
};

vi.mock('../usePixiWorld', async () => {
  const react = await import('react');

  return {
    usePixiWorld: ({
      setGame,
    }: {
      setGame: Dispatch<SetStateAction<GameState>>;
    }) => {
      setGameRef.current = setGame;

      return {
        hostRef: react.useRef<HTMLDivElement | null>(null),
        canvasReady: true,
      };
    },
  };
});

describe('App combat attention', () => {
  beforeEach(() => {
    setGameRef = { current: null };
  });

  it('opens hex content and marks its dock entry when entering a battle hex', async () => {
    const game = createHydratedAppGame();
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const { host, root } = await renderApp();
    await flushLazyModules();

    const hexContentButton = findHexContentDockButton(host);
    expect(hexContentButton).not.toBeNull();
    expect(hexContentButton?.dataset.opened).toBe('false');
    expect(
      hexContentButton?.querySelector('[class*="attentionBadge"]'),
    ).toBeNull();

    await act(async () => {
      setGameRef.current?.((current) =>
        moveToTile(
          { ...current, worldTimeMs: current.worldTimeMs },
          { q: 1, r: 0 },
        ),
      );
    });
    await flushLazyModules();

    const updatedHexContentButton = findHexContentDockButton(host);
    expect(updatedHexContentButton?.dataset.opened).toBe('true');
    expect(
      updatedHexContentButton?.querySelector('[class*="attentionBadge"]'),
    ).not.toBeNull();
    expect(host.textContent).toContain('(C)ontent');
    expect(host.textContent).toContain('(Q) Start');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});

function findHexContentDockButton(host: HTMLElement) {
  return Array.from(host.querySelectorAll('button')).find((button) =>
    button.getAttribute('aria-label')?.startsWith('Toggle Hex Content window'),
  ) as HTMLButtonElement | undefined;
}
