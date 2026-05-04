import { t } from '../i18n';
import { enemyKey, makeEnemy, nextEnemySpawnIndex } from './combat';
import { ItemId } from './content/ids';
import { hexKey } from './hex';
import { addLog } from './logs';
import { Skill, type GameState, type Item, type Tile } from './types';
import { createRng } from './random';
import { addItemToInventory, consumeInventoryItem } from './inventory';
import { gainSkillXp } from './progression';
import { terrainTier } from './shared';
import { startCombat } from './stateCombat';
import { createCombatState } from './stateCombatState';
import { cloneForWorldMutation, message } from './stateMutationHelpers';
import { getCurrentTile } from './stateWorldQueries';
import { getLockpickBreakChance, isLockedChestMimic } from './lockedChests';
import { makeWorldGeneratedItem } from './worldGeneratedItems';
import { ensureTileState } from './world';

export function applyLockedChestOpener(
  state: GameState,
  itemIndex: number,
  item: Item,
) {
  const currentTile = getCurrentTile(state);
  if (currentTile.structure !== 'locked-chest') {
    return message(
      state,
      t('game.message.lockedChest.requiresChest', { item: item.name }),
    );
  }

  const next = cloneForWorldMutation(state);
  ensureTileState(next, next.player.coord);
  const tileKey = hexKey(next.player.coord);
  const tile = next.tiles[tileKey]!;

  if (isLockedChestMimic(next.seed, next.player.coord)) {
    consumeInventoryItem(next.player.inventory, itemIndex, item);
    if (item.itemKey === ItemId.Lockpick) {
      gainSkillXp(next, Skill.Lockpicking, 1, addLog);
    }
    clearLockedChestTile(tile);
    const enemyIndex = nextEnemySpawnIndex(tile.enemyIds);
    const mimicId = enemyKey(next.player.coord, enemyIndex);
    const mimic = makeEnemy(
      next.seed,
      next.player.coord,
      tile.terrain,
      enemyIndex,
      undefined,
      next.bloodMoonActive,
      {
        enemyId: mimicId,
        enemyTypeId: 'mimic',
      },
    );
    tile.enemyIds = [mimic.id];
    next.tiles[tileKey] = { ...tile, enemyIds: [...tile.enemyIds] };
    next.enemies[mimic.id] = mimic;
    next.combat = createCombatState(
      next,
      next.player.coord,
      [mimic.id],
      next.worldTimeMs,
    );
    addLog(
      next,
      'combat',
      t('game.message.lockedChest.mimicReveal', { item: item.name }),
    );
    return startCombat(next);
  }

  if (item.itemKey === ItemId.ChestKey) {
    consumeInventoryItem(next.player.inventory, itemIndex, item);
    return openLockedChest(next, tile, item);
  }

  const breakChance = getLockpickBreakChance(
    next.player.skills[Skill.Lockpicking].level,
  );
  const broke =
    createRng(
      `${next.seed}:locked-chest:lockpick:${next.player.coord.q}:${next.player.coord.r}:${next.logSequence}`,
    )() < breakChance;

  consumeInventoryItem(next.player.inventory, itemIndex, item);
  gainSkillXp(next, Skill.Lockpicking, 1, addLog);
  if (broke) {
    addLog(
      next,
      'system',
      t('game.message.lockedChest.lockpickBreak', { item: item.name }),
    );
    return next;
  }

  return openLockedChest(next, tile, item);
}

function openLockedChest(state: GameState, tile: Tile, item: Item) {
  clearLockedChestTile(tile);
  const loot = makeWorldGeneratedItem(
    `${state.seed}:locked-chest:${state.player.coord.q}:${state.player.coord.r}`,
    state.player.coord,
    terrainTier(state.player.coord, tile.terrain),
    createRng(
      `${state.seed}:locked-chest:loot:${state.player.coord.q}:${state.player.coord.r}`,
    )(),
  );
  addItemToInventory(tile.items, loot);
  state.tiles[hexKey(state.player.coord)] = { ...tile, items: [...tile.items] };
  addLog(
    state,
    'loot',
    t('game.message.lockedChest.open', { item: item.name }),
  );
  return state;
}

function clearLockedChestTile(tile: Tile) {
  delete tile.structure;
  delete tile.structureHp;
  delete tile.structureMaxHp;
}
