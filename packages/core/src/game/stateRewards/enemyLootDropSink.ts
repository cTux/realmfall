import { t } from '../../i18n';
import { hexKey } from '../hex';
import { addLog } from '../logs';
import { addItemToInventory } from '../inventory';
import { ensureTileState } from '../world';
import type { Enemy, GameState, Item } from '../types';

type EnemyDrop = {
  item: Item;
  text?: string;
  suppressLog?: boolean;
};

function getEnemyTile(state: GameState, enemy: Enemy) {
  const key = hexKey(enemy.coord);
  ensureTileState(state, enemy.coord);
  const tile = state.tiles[key];
  return { key, tile };
}

export function addEnemyDrops(
  state: GameState,
  enemy: Enemy,
  drops: EnemyDrop[],
) {
  if (drops.length === 0) {
    return;
  }

  const { key, tile } = getEnemyTile(state, enemy);
  for (const { item } of drops) {
    addItemToInventory(tile.items, item);
  }
  state.tiles[key] = { ...tile, items: [...tile.items] };

  for (const { item, text, suppressLog } of drops) {
    if (suppressLog) continue;
    addLog(
      state,
      'loot',
      text ??
        t('game.message.enemyDrop.item', {
          enemy: enemy.name,
          item: item.name,
        }),
    );
  }
}

export function addEnemyDrop(
  state: GameState,
  enemy: Enemy,
  item: Item,
  text?: string,
) {
  addEnemyDrops(state, enemy, [{ item, text }]);
}
