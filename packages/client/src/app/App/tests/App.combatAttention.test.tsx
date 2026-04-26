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

function mockUsePixiWorld() {
  vi.doMock('../usePixiWorld', async () => {
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
}

describe('App combat attention', () => {
  beforeEach(() => {
    setGameRef = { current: null };
    mockUsePixiWorld();
  });

  it('opens hex content on structured hexes and closes it on empty hexes', async () => {
    const game = createHydratedAppGame();
    game.tiles['0,1'] = {
      coord: { q: 0, r: 1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const { host, root } = await renderApp();
    await flushLazyModules();

    const initialHexContentButton = findHexContentDockButton(host);
    expect(initialHexContentButton?.dataset.opened).toBe('true');
    expect(host.textContent).toContain('(C)ontent');
    expect(host.textContent).toContain('H(o)me');

    await act(async () => {
      setGameRef.current?.((current) =>
        moveToTile(
          { ...current, worldTimeMs: current.worldTimeMs },
          { q: 0, r: 1 },
        ),
      );
    });
    await flushLazyModules();

    const updatedHexContentButton = findHexContentDockButton(host);
    expect(updatedHexContentButton?.dataset.opened).toBe('false');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  }, 10_000);

  it('keeps hex content open on empty hexes when loot is available', async () => {
    const game = createHydratedAppGame();
    game.tiles['0,1'] = {
      coord: { q: 0, r: 1 },
      terrain: 'plains',
      items: [
        {
          id: 'loot-ore',
          name: 'Iron Ore',
          quantity: 2,
          tier: 1,
          rarity: 'common',
          power: 0,
          defense: 0,
          maxHp: 0,
          healing: 0,
          hunger: 0,
        },
      ],
      enemyIds: [],
    };
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const { host, root } = await renderApp();
    await flushLazyModules();

    await act(async () => {
      setGameRef.current?.((current) =>
        moveToTile(
          { ...current, worldTimeMs: current.worldTimeMs },
          { q: 0, r: 1 },
        ),
      );
    });
    await flushLazyModules();

    const updatedHexContentButton = findHexContentDockButton(host);
    expect(updatedHexContentButton?.dataset.opened).toBe('true');
    expect(host.textContent).toContain('Tak(e) all');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  }, 10_000);

  it('opens hex content and marks its dock entry when entering a battle hex', async () => {
    const game = createHydratedAppGame();
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const { host, root } = await renderApp();
    await flushLazyModules();

    const hexContentButton = findHexContentDockButton(host);
    expect(hexContentButton).not.toBeNull();
    expect(hexContentButton?.dataset.opened).toBe('true');
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
  }, 10_000);
});

function findHexContentDockButton(host: HTMLElement) {
  return Array.from(host.querySelectorAll('button')).find((button) =>
    button.getAttribute('aria-label')?.startsWith('Toggle Hex Content window'),
  ) as HTMLButtonElement | undefined;
}
