import { act } from 'react';
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
            { id: 'persisted-log', kind: 'system', text: 'old log', turn: 99 },
          ],
        },
        ui: {
          windows: { hero: { x: 30, y: 40 } },
          windowShown: {
            worldTime: true,
            hero: false,
            skills: true,
            recipes: true,
            hexInfo: true,
            equipment: true,
            inventory: true,
            loot: true,
            log: true,
            combat: true,
          },
        },
      });
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    await flushLazyModules();

    expect(loadEncryptedState).toHaveBeenCalledTimes(1);
    expect(renderScene).toHaveBeenCalled();
    expect(saveEncryptedState).not.toHaveBeenCalled();
    expect(host.querySelector(`.${styles.loadingScreen}`)).toBeNull();
    expect(host.textContent).toContain('(D)ebugger');
    expect(host.textContent).toContain('FPS Graph');
    expect(host.textContent).not.toContain('(C)haracter info');
    expect(host.textContent).toContain('(S)kills');
    expect(host.textContent).toContain('(R)ecipe book');
    expect(host.textContent).toContain('(H)ex info');
    expect(host.textContent).not.toContain('old log');
    expect(host.textContent).toContain('Lo(g)');
    expect(host.textContent).toContain('Year 1, Day 3, 00:15');

    const worldTimePanel = host.querySelector(
      '[aria-label="Debugger"]',
    ) as HTMLDivElement | null;
    const initialWorldTimePanelText = worldTimePanel?.textContent;

    await act(async () => {
      vi.advanceTimersByTime(60 * 1000);
    });
    await flushLazyModules();

    expect(saveEncryptedState).not.toHaveBeenCalled();
    expect(worldTimePanel?.textContent).not.toBe(initialWorldTimePanelText);
    expect(worldTimePanel?.textContent).toMatch(
      /Year \d+, Day \d+, \d{2}:\d{2}/,
    );
    expect(host.textContent).toContain('FPS Graph');
    expect(host.textContent).not.toContain('Hunger penalty');
    expect(host.textContent).toContain('Loot');
    expect(host.textContent).toContain('Prospect');

    const heroDockButton = host.querySelector(
      '[aria-label="Toggle Character info window"]',
    ) as HTMLButtonElement | null;
    const worldTimeDockButton = host.querySelector(
      '[aria-label="Toggle Debugger window"]',
    ) as HTMLButtonElement | null;
    expect(heroDockButton).not.toBeNull();
    expect(worldTimeDockButton?.getAttribute('aria-pressed')).toBe('true');
    expect(heroDockButton?.getAttribute('aria-pressed')).toBe('false');

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'd' }),
      );
    });
    expect(host.textContent).not.toContain('(D)ebugger');
    expect(worldTimeDockButton?.getAttribute('aria-pressed')).toBe('false');

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
  });
});
