import { normalizeLoadedGame, normalizeSavedUiItem } from '../app/normalize';
import { buildItemFromConfig } from '../game/content/items';
import { createGame } from '../game/stateFactory';

describe('normalize consumables', () => {
  it('re-merges legacy consumable stacks after restoring configured rarity', () => {
    const game = createGame(3, 'normalize-consumable-rarity');

    game.player.inventory = [
      buildItemFromConfig('mana-potion', {
        id: 'mana-potion-common',
        quantity: 2,
      }),
      buildItemFromConfig('mana-potion', {
        id: 'mana-potion-legacy-legendary',
        quantity: 1,
        rarity: 'legendary',
      }),
    ];

    const normalized = normalizeLoadedGame(game);
    const manaPotions =
      normalized?.player.inventory.filter(
        (item) => item.itemKey === 'mana-potion',
      ) ?? [];

    expect(manaPotions).toEqual([
      expect.objectContaining({
        itemKey: 'mana-potion',
        quantity: 3,
        rarity: 'common',
      }),
    ]);
  });

  it('restores saved consumable ui items to configured rarity', () => {
    expect(
      normalizeSavedUiItem({
        ...buildItemFromConfig('health-potion', {
          id: 'health-potion-ui-slot',
        }),
        rarity: 'epic',
      }),
    ).toEqual(
      expect.objectContaining({
        itemKey: 'health-potion',
        rarity: 'common',
      }),
    );
  });
});
