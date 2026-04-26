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

describe('App recipe-book crafting structure attention', () => {
  beforeEach(() => {
    setGameRef = { current: null };
  });

  it('opens the recipe book to the matching tab when entering a crafting structure hex', async () => {
    const game = createHydratedAppGame();
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      structure: 'workshop',
      enemyIds: [],
    };
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const { host, root } = await renderApp();
    await flushLazyModules();

    const recipeBookButton = findRecipeBookDockButton(host);
    expect(recipeBookButton?.dataset.opened).toBe('false');

    await act(async () => {
      setGameRef.current?.((current) =>
        moveToTile(
          { ...current, worldTimeMs: current.worldTimeMs },
          { q: 1, r: 0 },
        ),
      );
    });
    await flushLazyModules();
    await flushLazyModules();

    const updatedRecipeBookButton = findRecipeBookDockButton(host);
    expect(updatedRecipeBookButton?.dataset.opened).toBe('true');
    expect(getTab(host, 'crafting')?.getAttribute('aria-selected')).toBe(
      'true',
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  }, 2_000);
});

function findRecipeBookDockButton(host: HTMLElement) {
  return Array.from(host.querySelectorAll('button')).find((button) =>
    button.getAttribute('aria-label')?.startsWith('Toggle Recipe book window'),
  ) as HTMLButtonElement | undefined;
}

function getTab(host: HTMLElement, label: string) {
  return Array.from(host.querySelectorAll('[role="tab"]')).find(
    (tab) => tab.textContent === label,
  );
}
