import { act } from 'react';
import { createGame } from '../../../game/state';
import styles from '../styles.module.scss';
import {
  createHydratedAppGame,
  flushLazyModules,
  loadEncryptedState,
  renderApp,
  renderScene,
  saveEncryptedState,
} from './appTestHarness';

describe('App hydration and interactions', () => {
  it('hydrates saved state, handles ui interactions, and responds to map input', async () => {
    const game = createHydratedAppGame();

    let resolveLoad: ((value: unknown) => void) | null = null;
    loadEncryptedState.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
    );

    const { host, root } = await renderApp();

    expect(host.querySelector(`.${styles.loadingScreen}`)).not.toBeNull();
    expect(host.querySelector(`.${styles.loadingSpinner}`)).not.toBeNull();

    await act(async () => {
      resolveLoad?.({
        game: {
          ...game,
          logs: [
            {
              id: 'persisted-log',
              kind: 'system',
              text: 'old log',
              turn: 99,
            },
          ],
        },
        ui: {
          actionBarSlots: [{ item: game.player.inventory[0] }],
          windows: { hero: { x: 30, y: 40 } },
          windowShown: {
            hero: false,
            skills: true,
            recipes: true,
            hexInfo: true,
            equipment: true,
            inventory: true,
            loot: true,
            log: true,
            combat: true,
            settings: false,
          },
        },
      });
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    await flushLazyModules();
    await flushLazyModules();

    expect(loadEncryptedState).toHaveBeenCalledTimes(1);
    expect(renderScene).toHaveBeenCalled();
    expect(saveEncryptedState).not.toHaveBeenCalled();
    expect(host.querySelector(`.${styles.loadingScreen}`)).toBeNull();
    expect(host.textContent).not.toContain('(C)haracter info');
    expect(host.textContent).toContain('(S)kills');
    expect(host.textContent).toContain('(R)ecipe book');
    expect(host.textContent).toContain('(H)ex info');
    expect(host.textContent).not.toContain('old log');
    expect(host.textContent).toContain('Lo(g)');
    expect(host.querySelector('[aria-label="Action bar"]')).not.toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(60 * 1000);
    });
    await flushLazyModules();

    expect(saveEncryptedState).not.toHaveBeenCalled();
    expect(host.textContent).not.toContain('Hunger penalty');
    expect(host.textContent).toContain('Loot');
    expect(host.textContent).toContain('Prospect');

    const heroDockButton = host.querySelector(
      '[aria-label="Toggle Character info window"]',
    ) as HTMLButtonElement | null;
    expect(heroDockButton).not.toBeNull();
    expect(heroDockButton?.getAttribute('aria-pressed')).toBe('false');

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'c' }),
      );
    });
    await flushLazyModules();
    expect(host.textContent).toContain('(C)haracter info');
    expect(host.textContent).toContain('Hunger');
    expect(heroDockButton?.getAttribute('aria-pressed')).toBe('true');

    const filterButton = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Filters',
    );
    await act(async () => {
      filterButton?.click();
    });
    expect(host.textContent).toContain('movement');

    const checkbox = host.querySelector('input[type="checkbox"]');
    await act(async () => {
      checkbox?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const logDockButton = host.querySelector(
      '[aria-label="Toggle Log window"]',
    ) as HTMLButtonElement | null;
    expect(logDockButton?.getAttribute('aria-pressed')).toBe('true');

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'g' }),
      );
    });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(host.textContent).not.toContain('Filters');
    expect(logDockButton?.getAttribute('aria-pressed')).toBe('false');

    const inventoryConsumable = host.querySelector('[aria-label="consumable"]')
      ?.parentElement as HTMLButtonElement | null;
    expect(inventoryConsumable).not.toBeNull();

    await act(async () => {
      inventoryConsumable?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
    });

    await act(async () => {
      inventoryConsumable?.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          clientX: 80,
          clientY: 120,
        }),
      );
    });
    await flushLazyModules();
    expect(host.textContent).toContain('Use');

    const useButton = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Use',
    );
    await act(async () => {
      useButton?.click();
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: '1' }),
      );
    });
    await flushLazyModules();

    expect(host.querySelector('[aria-label="Action bar"]')).not.toBeNull();

    const takeAllButton = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Tak(e) all',
    );
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'e' }),
      );
      await Promise.resolve();
    });

    expect(takeAllButton).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  }, 15000);

  it('clears an action bar slot after the last assigned consumable is used', async () => {
    const game = createGame(2, 'app-action-bar-consume-seed');
    game.player.hp = 20;
    game.player.hunger = 80;
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const { host, root } = await renderApp();
    await flushLazyModules();

    const actionBarSlot = host.querySelector(
      '[aria-label="Empty action bar slot 1"]',
    ) as HTMLButtonElement | null;
    expect(actionBarSlot).not.toBeNull();

    await act(async () => {
      actionBarSlot?.click();
    });

    const assignButton = host.querySelector(
      '[aria-label="Assign Trail Ration to action bar slot"]',
    ) as HTMLButtonElement | null;
    expect(assignButton).not.toBeNull();

    await act(async () => {
      assignButton?.click();
    });

    expect(
      host.querySelector('[aria-label="Action bar slot 1: Trail Ration"]'),
    ).not.toBeNull();
    expect(host.textContent).toContain('x2');

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: '1' }),
      );
    });

    expect(
      host.querySelector('[aria-label="Action bar slot 1: Trail Ration"]'),
    ).not.toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(2200);
    });
    await flushLazyModules();

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: '1' }),
      );
    });

    expect(
      host.querySelector('[aria-label="Action bar slot 1: Trail Ration"]'),
    ).toBeNull();
    expect(
      host.querySelector('[aria-label="Empty action bar slot 1"]'),
    ).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('does not render an action bar cooldown overlay after consumable use', async () => {
    const game = createGame(2, 'app-action-bar-cooldown-seed');
    game.player.hp = 20;
    game.player.hunger = 80;
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const { host, root } = await renderApp();
    await flushLazyModules();

    const actionBarSlot = host.querySelector(
      '[aria-label="Empty action bar slot 1"]',
    ) as HTMLButtonElement | null;
    expect(actionBarSlot).not.toBeNull();

    await act(async () => {
      actionBarSlot?.click();
    });

    const assignButton = host.querySelector(
      '[aria-label="Assign Trail Ration to action bar slot"]',
    ) as HTMLButtonElement | null;
    expect(assignButton).not.toBeNull();

    await act(async () => {
      assignButton?.click();
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: '1' }),
      );
    });

    const slotButton = host.querySelector(
      '[aria-label="Action bar slot 1: Trail Ration"]',
    ) as HTMLButtonElement | null;
    expect(slotButton?.className).not.toContain('cooldownActive');
    expect(slotButton?.querySelector('[class*="cooldownOverlay"]')).toBeNull();

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: '1' }),
      );
    });

    expect(
      host.querySelector('[aria-label="Action bar slot 1: Trail Ration"]'),
    ).not.toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(2200);
    });
    await flushLazyModules();

    const refreshedSlotButton = host.querySelector(
      '[aria-label="Action bar slot 1: Trail Ration"]',
    ) as HTMLButtonElement | null;
    expect(refreshedSlotButton?.className).not.toContain('cooldownActive');
    expect(
      refreshedSlotButton?.querySelector('[class*="cooldownOverlay"]'),
    ).toBeNull();

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: '1' }),
      );
    });

    expect(
      host.querySelector('[aria-label="Empty action bar slot 1"]'),
    ).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
