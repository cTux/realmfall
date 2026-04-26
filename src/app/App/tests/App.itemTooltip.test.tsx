import { act } from 'react';
import {
  createHydratedAppGame,
  flushLazyModules,
  loadEncryptedState,
  renderApp,
} from './appTestHarness';

const REJECTED_TOOLTIP_CHUNK_TEST_TIMEOUT_MS = 2_000;
const loadItemTooltipModuleMock = vi.hoisted(() => vi.fn());

vi.mock('../itemTooltipModuleLoader', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../itemTooltipModuleLoader')>();

  return {
    ...actual,
    loadItemTooltipModule: loadItemTooltipModuleMock,
  };
});

describe('App item tooltip lazy loading', () => {
  beforeEach(() => {
    loadItemTooltipModuleMock.mockImplementation(
      () => import('../../../ui/tooltips/itemTooltips'),
    );
  });

  afterEach(() => {
    loadItemTooltipModuleMock.mockReset();
  });

  it(
    'swallows rejected item tooltip chunk loads during inventory hover',
    async () => {
      const game = createHydratedAppGame();
      const tooltipLoadError = new Error('tooltip chunk failed');
      const onUnhandledRejection = vi.fn((event: PromiseRejectionEvent) => {
        event.preventDefault();
      });

      loadEncryptedState.mockResolvedValue({
        game,
        ui: {
          windowShown: {
            hero: false,
            skills: false,
            recipes: false,
            hexInfo: false,
            equipment: false,
            inventory: true,
            loot: false,
            log: false,
            combat: false,
            settings: false,
          },
        },
      });

      loadItemTooltipModuleMock.mockRejectedValue(tooltipLoadError);
      window.addEventListener('unhandledrejection', onUnhandledRejection);

      const { host, root } = await renderApp();

      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      await flushLazyModules();

      const inventoryConsumable = host.querySelector(
        '[aria-label="consumable"]',
      )?.parentElement as HTMLButtonElement | null;
      expect(inventoryConsumable).not.toBeNull();

      await act(async () => {
        inventoryConsumable?.dispatchEvent(
          new MouseEvent('mouseover', { bubbles: true }),
        );
        await vi.dynamicImportSettled();
      });

      expect(onUnhandledRejection).not.toHaveBeenCalled();
      expect(host.querySelector('[data-tooltip-visible="true"]')).toBeNull();

      window.removeEventListener('unhandledrejection', onUnhandledRejection);

      await act(async () => {
        root.unmount();
      });
      host.remove();
    },
    REJECTED_TOOLTIP_CHUNK_TEST_TIMEOUT_MS,
  );

  it('renders corrupted item titles and modified stat tones in inventory tooltips', async () => {
    const game = createHydratedAppGame();
    game.player.inventory = [
      {
        id: 'weapon-1',
        slot: 'weapon',
        name: 'Void Saber',
        quantity: 1,
        tier: 10,
        rarity: 'epic',
        power: 100,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
        secondaryStatCapacity: 1,
        secondaryStats: [
          { key: 'attackSpeed', value: 5 },
          { key: 'criticalStrikeChance', value: 5 },
        ],
        reforgedSecondaryStatIndex: 0,
        enchantedSecondaryStatIndex: 1,
        corrupted: true,
      },
    ];

    loadEncryptedState.mockResolvedValue({
      game,
      ui: {
        windowShown: {
          hero: false,
          skills: false,
          recipes: false,
          hexInfo: false,
          equipment: false,
          inventory: true,
          loot: false,
          log: false,
          combat: false,
          settings: false,
        },
      },
    });

    const { host, root } = await renderApp();

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    await flushLazyModules();

    const inventoryWeapon = host.querySelector('[aria-label="weapon"]')
      ?.parentElement as HTMLButtonElement | null;
    expect(inventoryWeapon).not.toBeNull();

    await act(async () => {
      inventoryWeapon?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
      await vi.dynamicImportSettled();
      vi.advanceTimersByTime(20);
    });

    const tooltip = host.querySelector(
      '[data-tooltip-visible]',
    ) as HTMLElement | null;
    const title = tooltip?.querySelector('strong') as HTMLElement | null;

    expect(tooltip?.getAttribute('data-tooltip-visible')).toBe('true');
    expect(title?.textContent).toContain('[Corrupted]');
    expect(title?.style.color).toBe('rgb(239, 68, 68)');
    expect(
      tooltip?.querySelector('[class*="reforged"]')?.textContent,
    ).toContain('Attack Speed');
    expect(
      tooltip?.querySelector('[class*="enchanted"]')?.textContent,
    ).toContain('Critical Strike Chance');

    await act(async () => {
      root.unmount();
    });
    host.remove();
  }, 2_000);
});
