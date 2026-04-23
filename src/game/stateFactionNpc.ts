import { t } from '../i18n';
import { StatusEffectTypeId } from './content/ids';
import { getGoldAmount } from './inventory';
import { getPlayerCombatStats } from './progression';
import { getCurrentTile } from './stateWorldQueries';
import type { GameState, PlayerStatusEffect } from './types';

export const FACTION_NPC_HEAL_COST = 1;

type FactionNpcHealStatusState = Pick<GameState, 'tiles' | 'seed'> & {
  player: Pick<
    GameState['player'],
    | 'coord'
    | 'equipment'
    | 'hp'
    | 'inventory'
    | 'baseAttack'
    | 'baseDefense'
    | 'baseMaxHp'
    | 'baseMaxMana'
    | 'hunger'
    | 'level'
    | 'learnedRecipeIds'
    | 'mana'
    | 'masteryLevel'
    | 'skills'
    | 'statusEffects'
    | 'thirst'
    | 'xp'
  >;
};

export function getCurrentHexFactionNpcHealStatus(
  state: FactionNpcHealStatusState,
) {
  const tile = getCurrentTile(state);
  if (tile.claim?.ownerType !== 'faction' || !tile.claim.npc) {
    return {
      canHeal: false,
      cost: FACTION_NPC_HEAL_COST,
      reason: t('game.message.factionNpcHeal.noResident'),
    };
  }

  if (getGoldAmount(state.player.inventory) < FACTION_NPC_HEAL_COST) {
    return {
      canHeal: false,
      cost: FACTION_NPC_HEAL_COST,
      reason: t('game.message.factionNpcHeal.needsGold', {
        gold: FACTION_NPC_HEAL_COST,
      }),
    };
  }

  const hasRemovableDebuff = state.player.statusEffects.some(
    (effect) =>
      effect.id !== StatusEffectTypeId.Hunger &&
      effect.id !== StatusEffectTypeId.Thirst &&
      isNegativeStatusEffect(effect.id),
  );
  if (
    state.player.hp >= getPlayerCombatStats(state.player).maxHp &&
    !hasRemovableDebuff
  ) {
    return {
      canHeal: false,
      cost: FACTION_NPC_HEAL_COST,
      reason: t('game.message.factionNpcHeal.notNeeded'),
    };
  }

  return {
    canHeal: true,
    cost: FACTION_NPC_HEAL_COST,
    reason: null,
  };
}

export function clearNonSurvivalDebuffs(
  statusEffects: GameState['player']['statusEffects'],
) {
  return statusEffects.filter(
    (effect) =>
      effect.id === StatusEffectTypeId.Hunger ||
      effect.id === StatusEffectTypeId.Thirst ||
      !isNegativeStatusEffect(effect.id),
  );
}

function isNegativeStatusEffect(effectId: PlayerStatusEffect['id']) {
  switch (effectId) {
    case StatusEffectTypeId.Hunger:
    case StatusEffectTypeId.Thirst:
    case StatusEffectTypeId.RecentDeath:
    case StatusEffectTypeId.Bleeding:
    case StatusEffectTypeId.Poison:
    case StatusEffectTypeId.Burning:
    case StatusEffectTypeId.Chilling:
    case StatusEffectTypeId.Weakened:
    case StatusEffectTypeId.Shocked:
      return true;
    default:
      return false;
  }
}
