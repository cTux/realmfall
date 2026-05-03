import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { GameState, Item } from '../../../game/stateTypes';
import { createGame } from '../../../game/stateFactory';
import { settleUi, setupUiTestEnvironment } from '../../../ui/uiTestHelpers';
import { getTooltipState, resetTooltipState } from '../tooltipStore';
import { useItemTooltipController } from './useItemTooltipController';

setupUiTestEnvironment();

describe('useItemTooltipController', () => {
  afterEach(() => {
    resetTooltipState();
  });

  it('includes offhand losses when previewing a two-handed weapon', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    let controller: ReturnType<typeof useItemTooltipController> | null = null;
    const game = createGame(2, 'two-handed-weapon-tooltip');
    game.player.level = 3;

    const equippedWeapon: Item = {
      id: 'equipped-weapon',
      itemKey: 'town-knife',
      name: 'Town Knife',
      slot: 'weapon',
      quantity: 1,
      tier: 1,
      rarity: 'common',
      power: 1,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    };
    const equippedOffhand: Item = {
      id: 'equipped-offhand',
      itemKey: 'hide-buckler',
      name: 'Hide Buckler',
      slot: 'offhand',
      quantity: 1,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 2,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      secondaryStats: [{ key: 'attackSpeed', value: 5 }],
    };
    const previewItem: Item = {
      id: 'preview-two-handed-weapon',
      itemKey: 'generated-two-handed-sword',
      name: 'Two-Handed Sword',
      slot: 'weapon',
      quantity: 1,
      tier: 3,
      rarity: 'rare',
      power: 4,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    };

    game.player.equipment.weapon = equippedWeapon;
    game.player.equipment.offhand = equippedOffhand;

    const gameRef: { current: GameState } = { current: game };
    const tooltipPositionRef = { current: null };

    function Harness() {
      controller = useItemTooltipController({
        gameRef,
        showTooltipTags: true,
        tooltipPositionRef,
      });
      return <button id="anchor">Anchor</button>;
    }

    await act(async () => {
      root.render(<Harness />);
    });

    const anchor = host.querySelector('#anchor') as HTMLElement | null;
    expect(anchor).toBeTruthy();

    await act(async () => {
      controller?.showItemTooltip(
        { currentTarget: anchor! } as ReactMouseEvent<HTMLElement>,
        previewItem,
        equippedWeapon,
      );
    });
    await settleUi();

    expect(getTooltipState()?.lines).toContainEqual({
      kind: 'stat',
      label: 'Attack',
      value: '+3',
      tone: 'item',
    });
    expect(getTooltipState()?.lines).toContainEqual({
      kind: 'stat',
      label: 'Defense',
      value: '-2',
      tone: 'negative',
    });
    expect(getTooltipState()?.lines).toContainEqual({
      kind: 'stat',
      label: 'Attack Speed',
      value: '-5',
      tone: 'negative',
    });

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('rebuilds tooltip content when the tag-visibility setting changes', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    let controller: ReturnType<typeof useItemTooltipController> | null = null;
    const game = createGame(2, 'tooltip-tag-visibility-setting');
    const previewItem: Item = {
      id: 'preview-weapon',
      itemKey: 'generated-sword',
      name: 'Sword',
      slot: 'weapon',
      quantity: 1,
      tier: 3,
      rarity: 'rare',
      power: 4,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    };
    const gameRef: { current: GameState } = { current: game };
    const tooltipPositionRef = { current: null };
    let showTooltipTags = true;

    function Harness() {
      controller = useItemTooltipController({
        gameRef,
        showTooltipTags,
        tooltipPositionRef,
      });
      return <button id="anchor">Anchor</button>;
    }

    await act(async () => {
      root.render(<Harness />);
    });

    const anchor = host.querySelector('#anchor') as HTMLElement | null;
    expect(anchor).toBeTruthy();

    await act(async () => {
      controller?.showItemTooltip(
        { currentTarget: anchor! } as ReactMouseEvent<HTMLElement>,
        previewItem,
      );
    });
    await settleUi();

    expect(
      getTooltipState()?.lines.some((line) => line.text?.startsWith('Tags:')),
    ).toBe(true);

    showTooltipTags = false;
    await act(async () => {
      root.render(<Harness />);
    });

    await act(async () => {
      controller?.showItemTooltip(
        { currentTarget: anchor! } as ReactMouseEvent<HTMLElement>,
        previewItem,
      );
    });
    await settleUi();

    expect(
      getTooltipState()?.lines.some((line) => line.text?.startsWith('Tags:')),
    ).toBe(false);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
