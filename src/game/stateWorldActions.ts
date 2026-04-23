import { hexKey, type HexCoord } from './hex';
import { t } from '../i18n';
import { formatSkillLabel } from '../i18n/labels';
import { addLog } from './logs';
import { addItemToInventory, spendGold } from './inventory';
import { GAME_TAGS } from './content/tags';
import { hasItemTag } from './content/items';
import {
  gatheringYieldBonus,
  getPlayerStats,
  gainSkillXp,
  rollGatheringBonus,
} from './progression';
import { isPlayerClaim, makePlayerClaim } from './territories';
import {
  buildTile,
  ensureTileState,
  isGatheringStructure,
  normalizeStructureState,
  structureDefinition,
} from './world';
import {
  cloneForHomeMutation,
  cloneForPlayerMutation,
  cloneForPlayerAndTileMutation,
  message,
} from './stateMutationHelpers';
import {
  clearNonSurvivalDebuffs,
  FACTION_NPC_HEAL_COST,
  getCurrentHexFactionNpcHealStatus,
} from './stateFactionNpc';
import {
  buildGatheringRewards,
  describeItemStacks,
  maybeGatherByproduct,
} from './stateRewards';
import { getCurrentHexClaimStatus } from './stateClaims';
import { applySurvivalDecay, respawnAtNearestTown } from './stateSurvival';
import { getCurrentTile, getTileAt } from './stateWorldQueries';
import type { GameState, Item } from './types';

export function setHomeHex(
  state: GameState,
  coord: HexCoord = state.player.coord,
) {
  const targetTile = getTileAt(state, coord);
  if (targetTile.claim && !isPlayerClaim(targetTile.claim)) {
    return message(state, t('game.message.home.blockedByTerritory'));
  }
  if (!isHomeHexEmpty(targetTile)) {
    return message(state, t('game.message.home.blockedByOccupied'));
  }

  const next = cloneForHomeMutation(state);
  next.homeHex = { ...coord };

  const key = hexKey(coord);
  const existingTile = next.tiles[key] ?? buildTile(next.seed, coord);
  existingTile.enemyIds.forEach((enemyId) => {
    delete next.enemies[enemyId];
  });
  next.tiles[key] = sanitizeHomeTile(existingTile);

  if (next.combat?.coord.q === coord.q && next.combat.coord.r === coord.r) {
    next.combat = null;
  }

  addLog(
    next,
    'system',
    t('game.message.home.set', { q: coord.q, r: coord.r }),
  );
  return next;
}

export function claimCurrentHex(state: GameState): GameState {
  if (state.gameOver) return state;
  if (state.combat) {
    return message(state, t('game.message.combat.finishCurrentBattleFirst'));
  }

  const status = getCurrentHexClaimStatus(state);
  if (!status.canClaim) {
    return message(state, status.reason ?? t('game.message.claim.unavailable'));
  }

  const next = cloneForPlayerAndTileMutation(state);
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const tile = next.tiles[key];

  if (status.action === 'unclaim') {
    tile.claim = undefined;
    next.tiles[key] = { ...tile };
    addLog(
      next,
      'system',
      t('game.message.claim.removed', {
        q: next.player.coord.q,
        r: next.player.coord.r,
      }),
    );
    return next;
  }

  consumeInventoryResource(next.player.inventory, 'cloth', 1);
  consumeInventoryResource(next.player.inventory, 'sticks', 1);
  tile.claim = makePlayerClaim();
  next.tiles[key] = { ...tile };

  addLog(
    next,
    'system',
    t('game.message.claim.success', {
      q: next.player.coord.q,
      r: next.player.coord.r,
    }),
  );
  return next;
}

export function interactWithStructure(state: GameState): GameState {
  if (state.gameOver) return state;
  if (state.combat) {
    return message(state, t('game.message.combat.finishCurrentBattleFirst'));
  }

  const tile = getCurrentTile(state);
  if (!isGatheringStructure(tile.structure)) {
    return message(state, t('game.message.gather.nothingHere'));
  }

  const next = cloneForPlayerAndTileMutation(state);
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const currentTile = next.tiles[key];
  if (!isGatheringStructure(currentTile.structure)) {
    return message(state, t('game.message.gather.nothingHere'));
  }

  next.turn += 1;
  applySurvivalDecay(next);

  if (next.player.hp <= 0) {
    respawnAtNearestTown(next, next.player.coord);
    return next;
  }

  const definition = structureDefinition(currentTile.structure);
  const skill = next.player.skills[definition.skill];
  const damage = Math.min(currentTile.structureHp ?? definition.maxHp, 1);
  const bonusLoot = rollGatheringBonus(next, definition.skill);
  const quantity =
    definition.baseYield + gatheringYieldBonus(skill.level) + bonusLoot;

  currentTile.structureHp = Math.max(
    0,
    (currentTile.structureHp ?? definition.maxHp) - damage,
  );
  const rewards = buildGatheringRewards(
    next,
    currentTile.structure,
    definition,
    quantity,
  );
  rewards.forEach((reward) =>
    addItemToInventory(next.player.inventory, reward),
  );
  const byproduct = maybeGatherByproduct(
    next,
    currentTile.structure,
    definition,
  );
  gainSkillXp(next, definition.skill, damage, addLog);

  addLog(
    next,
    'loot',
    t('game.message.gather.success', {
      action: definition.verb,
      item: describeItemStacks(rewards),
    }),
  );
  if (bonusLoot > 0) {
    addLog(
      next,
      'system',
      t('game.message.gather.bonus', {
        skill: formatSkillLabel(definition.skill),
        reward: definition.reward.toLocaleLowerCase(),
      }),
    );
  }

  if (byproduct) {
    addItemToInventory(next.player.inventory, byproduct.item);
    addLog(next, 'loot', byproduct.text);
  }

  if (currentTile.structureHp <= 0) {
    addLog(next, 'system', definition.depletedText);
  }

  next.tiles[key] = normalizeStructureState({
    ...currentTile,
    items: [...currentTile.items],
  });
  return next;
}

export function healAtFactionNpc(state: GameState): GameState {
  if (state.gameOver) return state;
  if (state.combat) {
    return message(state, t('game.message.combat.finishCurrentBattleFirst'));
  }

  const healStatus = getCurrentHexFactionNpcHealStatus(state);
  if (!healStatus.canHeal) {
    return message(
      state,
      healStatus.reason ?? t('game.message.factionNpcHeal.unavailable'),
    );
  }

  const tile = getCurrentTile(state);
  if (!tile.claim?.npc) {
    return message(state, t('game.message.factionNpcHeal.noResident'));
  }

  const next = cloneForPlayerMutation(state);
  next.player.hp = getPlayerStats(next.player).maxHp;
  next.player.statusEffects = clearNonSurvivalDebuffs(
    next.player.statusEffects,
  );
  spendGold(next.player.inventory, FACTION_NPC_HEAL_COST);

  addLog(
    next,
    'system',
    t('game.message.factionNpcHeal.complete', {
      gold: FACTION_NPC_HEAL_COST,
      npc: tile.claim.npc.name,
    }),
  );
  return next;
}

function consumeInventoryResource(
  inventory: Item[],
  itemKey: 'cloth' | 'sticks',
  quantity: number,
) {
  let remaining = quantity;
  for (
    let index = inventory.length - 1;
    index >= 0 && remaining > 0;
    index -= 1
  ) {
    const item = inventory[index];
    if (
      !hasItemTag(item, GAME_TAGS.item.resource) ||
      item.itemKey !== itemKey
    ) {
      continue;
    }

    const spent = Math.min(item.quantity, remaining);
    item.quantity -= spent;
    remaining -= spent;
    if (item.quantity <= 0) {
      inventory.splice(index, 1);
    }
  }
}

function sanitizeHomeTile(tile: GameState['tiles'][string]) {
  return {
    ...tile,
    items: [],
    structure: undefined,
    structureHp: undefined,
    structureMaxHp: undefined,
    enemyIds: [],
  };
}

function isHomeHexEmpty(tile: ReturnType<typeof getTileAt>) {
  return (
    tile.items.length === 0 &&
    tile.structure == null &&
    tile.enemyIds.length === 0
  );
}
