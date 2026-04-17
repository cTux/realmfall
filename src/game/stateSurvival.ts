import { StatusEffectTypeId } from './content/ids';
import { addLog } from './logs';
import { getPlayerStats } from './progression';
import { t } from '../i18n';
import type { HexCoord } from './hex';
import type { GameState, Item, PlayerStatusEffect } from './types';

export function teleportHome(state: GameState, itemIndex: number, item: Item) {
  state.player.inventory[itemIndex]!.quantity -= 1;
  if (state.player.inventory[itemIndex]!.quantity <= 0) {
    state.player.inventory.splice(itemIndex, 1);
  }
  state.player.coord = { ...state.homeHex };
  state.combat = null;
  addLog(state, 'system', t('game.message.home.scroll', { item: item.name }));
}

export function respawnAtNearestTown(state: GameState, from: HexCoord) {
  void from;
  const homeHex = { ...state.homeHex };
  state.player.coord = homeHex;
  state.player.hunger = 100;
  state.player.thirst = 100;
  upsertPlayerStatusEffect(state.player.statusEffects, {
    id: StatusEffectTypeId.RecentDeath,
  });
  upsertPlayerStatusEffect(state.player.statusEffects, {
    id: StatusEffectTypeId.Restoration,
    expiresAt: state.worldTimeMs + 100_000,
    tickIntervalMs: 1_000,
    lastProcessedAt: state.worldTimeMs,
  });
  state.player.hp = 1;
  state.player.mana = 1;
  state.player.hp = Math.min(
    state.player.hp,
    getPlayerStats(state.player).maxHp,
  );
  state.combat = null;
  addLog(state, 'combat', t('game.message.combat.defeated'));
  addLog(
    state,
    'system',
    t('game.message.combat.respawn', { q: homeHex.q, r: homeHex.r }),
  );
}

export function applySurvivalDecay(state: GameState) {
  processPlayerStatusEffects(state);
  state.player.hunger = Math.max(0, state.player.hunger - 1);
  state.player.thirst = Math.max(0, (state.player.thirst ?? 100) - 1);

  let damage = 0;
  if (state.player.hunger <= 30) {
    damage += 1;
    addLog(state, 'survival', t('game.message.survival.starving'));
  }
  if ((state.player.thirst ?? 100) <= 30) {
    damage += 1;
    addLog(state, 'survival', t('game.message.survival.dehydrated'));
  }

  if (damage > 0) {
    state.player.hp = Math.max(0, state.player.hp - damage);
  }
}

export function processPlayerStatusEffects(state: GameState) {
  let changed = false;
  const remainingEffects: PlayerStatusEffect[] = [];

  state.player.statusEffects.forEach((effect) => {
    if (effect.id !== 'restoration') {
      remainingEffects.push(effect);
      return;
    }

    const lastProcessedAt = effect.lastProcessedAt ?? state.worldTimeMs;
    const effectEndAt = effect.expiresAt ?? lastProcessedAt;
    const effectiveNow = Math.min(state.worldTimeMs, effectEndAt);
    const tickIntervalMs = effect.tickIntervalMs ?? 1_000;
    const tickCount = Math.floor(
      Math.max(0, effectiveNow - lastProcessedAt) / tickIntervalMs,
    );

    if (tickCount > 0) {
      const stats = getPlayerStats(state.player);
      state.player.hp = Math.min(
        stats.maxHp,
        state.player.hp +
          Math.max(1, Math.floor(stats.maxHp * 0.01)) * tickCount,
      );
      state.player.mana = Math.min(
        state.player.baseMaxMana,
        state.player.mana +
          Math.max(1, Math.floor(state.player.baseMaxMana * 0.01)) * tickCount,
      );
      changed = true;
    }

    if (effect.expiresAt != null && state.worldTimeMs >= effect.expiresAt) {
      changed = true;
      return;
    }

    const nextLastProcessedAt = lastProcessedAt + tickCount * tickIntervalMs;
    if (nextLastProcessedAt !== effect.lastProcessedAt) {
      changed = true;
    }

    remainingEffects.push({
      ...effect,
      lastProcessedAt: nextLastProcessedAt,
    });
  });

  if (remainingEffects.length !== state.player.statusEffects.length) {
    changed = true;
  }

  state.player.statusEffects = remainingEffects;
  const maxHp = getPlayerStats(state.player).maxHp;
  if (state.player.hp > maxHp) {
    state.player.hp = maxHp;
    changed = true;
  }

  return changed;
}

function upsertPlayerStatusEffect(
  statusEffects: PlayerStatusEffect[],
  effect: PlayerStatusEffect,
) {
  const existingIndex = statusEffects.findIndex(
    (current) => current.id === effect.id,
  );
  if (existingIndex >= 0) {
    statusEffects[existingIndex] = effect;
    return;
  }

  statusEffects.push(effect);
}
