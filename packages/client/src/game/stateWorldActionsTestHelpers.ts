import { buildItemFromConfig } from './content/items';
import type { ItemKey } from './content/ids';
import type { GameState } from './types';

export function addBannerMaterials(
  game: GameState,
  quantity: number,
  idPrefix: string,
) {
  addResourceItems(
    game,
    [
      { itemKey: 'cloth', quantity },
      { itemKey: 'sticks', quantity },
    ],
    idPrefix,
  );
}

export function addResourceItems(
  game: GameState,
  items: Array<{ itemKey: ItemKey; quantity: number }>,
  idPrefix: string,
) {
  game.player.inventory.push(
    ...items.map(({ itemKey, quantity }, index) =>
      buildItemFromConfig(itemKey, {
        id: `${idPrefix}-${itemKey}-${index}`,
        quantity,
      }),
    ),
  );
}
