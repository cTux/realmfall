import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi } from 'vitest';
import { GameTag } from '../../../game/content/tags';
import type { Item } from '../../../game/state';
import { setWorldClockTime } from '../../../app/App/worldClockStore';
import { ActionBar } from './ActionBar';

describe('ActionBar', () => {
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
    setWorldClockTime(0);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
    setWorldClockTime(0);
    vi.restoreAllMocks();
  });

  it('updates cooldown presentation from the shared world clock store', async () => {
    const trailRation: Item = {
      id: 'trail-ration-1',
      itemKey: 'trail-ration',
      name: 'Trail Ration',
      quantity: 1,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 12,
      thirst: 0,
      tags: [GameTag.ItemConsumable, GameTag.ItemStackable],
    };

    await act(async () => {
      root.render(
        <ActionBar
          inventory={[trailRation]}
          slots={[
            { item: trailRation },
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
          ]}
          consumableCooldownEndsAt={2_000}
          onAssignSlot={vi.fn()}
          onClearSlot={vi.fn()}
          onHoverItem={vi.fn()}
          onLeaveItem={vi.fn()}
        />,
      );
    });

    const getCooldownOverlay = () =>
      host.querySelector(
        '[aria-label="Action bar slot 1: Trail Ration"] [style*="--cooldown-scale"]',
      ) as HTMLSpanElement | null;

    expect(getCooldownOverlay()).not.toBeNull();
    expect(
      getCooldownOverlay()?.style.getPropertyValue('--cooldown-scale'),
    ).toBe('1');

    await act(async () => {
      setWorldClockTime(1_000);
    });

    expect(
      getCooldownOverlay()?.style.getPropertyValue('--cooldown-scale'),
    ).toBe('0.5');

    await act(async () => {
      setWorldClockTime(2_500);
    });

    expect(getCooldownOverlay()).toBeNull();
  });
});
