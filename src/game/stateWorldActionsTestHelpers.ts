import type { GameState } from './types';

export function addBannerMaterials(
  game: GameState,
  quantity: number,
  idPrefix: string,
) {
  game.player.inventory.push(
    {
      id: `${idPrefix}-cloth`,
      itemKey: 'cloth',
      name: 'Cloth',
      quantity,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      thirst: 0,
    },
    {
      id: `${idPrefix}-sticks`,
      itemKey: 'sticks',
      name: 'Sticks',
      quantity,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      thirst: 0,
    },
  );
}
