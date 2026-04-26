import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi } from 'vitest';
import { GameTag } from '../../../game/content/tags';
import type { Item } from '../../../game/stateTypes';
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
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
    vi.restoreAllMocks();
  });

  it('does not render cooldown overlays for populated slots', async () => {
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
          onAssignSlot={vi.fn()}
          onClearSlot={vi.fn()}
          onHoverItem={vi.fn()}
          onLeaveItem={vi.fn()}
        />,
      );
    });

    const slotButton = host.querySelector(
      '[aria-label="Action bar slot 1: Trail Ration"]',
    ) as HTMLButtonElement | null;

    expect(slotButton).not.toBeNull();
    expect(slotButton?.className).not.toContain('cooldownActive');
    expect(slotButton?.querySelector('[class*="cooldownOverlay"]')).toBeNull();
  });
});
