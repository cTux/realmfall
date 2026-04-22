import { t } from '../i18n';
import { formatEquipmentSlotLabel } from '../i18n/labels';
import {
  type ConsumableEffectDescriptor,
  getConsumableEffectDescriptors,
  resolvePercentRestoreAmount,
} from './consumables';
import { EquipmentSlotId, ItemId } from './content/ids';
import { hasItemTag, itemOccupiesOffhand } from './content/items';
import { GAME_TAGS } from './content/tags';
import { learnRecipe, RECIPE_BOOK_RECIPES } from './crafting';
import { addLog } from './logs';
import {
  addItemToInventory,
  canUseItem,
  consumeInventoryItem,
  isRecipePage,
} from './inventory';
import { getPlayerStats } from './progression';
import {
  cloneForPlayerCombatMutation,
  cloneForPlayerMutation,
  message,
} from './stateMutationHelpers';
import { teleportHome } from './stateSurvival';
import type { EquipmentSlot, GameState, Item } from './types';

const CONSUMABLE_COOLDOWN_MS = 2_000;
const CONSUMABLE_LOG_EFFECT_KEYS = {
  healing: 'game.message.useItem.healing',
  hunger: 'game.message.useItem.hunger',
  mana: 'game.message.useItem.mana',
  thirst: 'game.message.useItem.thirst',
} as const;

type AppliedConsumableEffect = {
  amount: number;
  kind: keyof typeof CONSUMABLE_LOG_EFFECT_KEYS;
};

export function activateInventoryItem(
  state: GameState,
  itemId: string,
): GameState {
  if (state.gameOver) return state;

  const item = state.player.inventory.find((entry) => entry.id === itemId);
  if (!item) return message(state, t('game.message.item.notInPack'));

  if (isRecipePage(item) || canUseItem(item, state.player.learnedRecipeIds)) {
    return applyInventoryItemUse(state, itemId);
  }

  return equipItem(state, itemId);
}

export function equipItem(state: GameState, itemId: string): GameState {
  if (state.gameOver) return state;

  const itemIndex = state.player.inventory.findIndex(
    (item) => item.id === itemId,
  );
  if (itemIndex < 0) return message(state, t('game.message.item.notInPack'));

  const item = state.player.inventory[itemIndex];
  if (hasItemTag(item, GAME_TAGS.item.resource))
    return message(
      state,
      t('game.message.equipment.resourcesCannotBeEquipped'),
    );

  if (!item.slot)
    return message(state, t('game.message.equipment.cannotEquip'));

  const next = cloneForPlayerMutation(state);
  next.player.inventory.splice(itemIndex, 1);

  if (
    item.slot === EquipmentSlotId.Offhand &&
    itemOccupiesOffhand(next.player.equipment.weapon)
  ) {
    return message(state, t('game.message.equipment.offhandDisabled'));
  }

  const replaced = next.player.equipment[item.slot];
  if (replaced) addItemToInventory(next.player.inventory, replaced);
  next.player.equipment[item.slot] = item;
  if (item.slot === EquipmentSlotId.Weapon && itemOccupiesOffhand(item)) {
    const offhand = next.player.equipment.offhand;
    if (offhand) {
      addItemToInventory(next.player.inventory, offhand);
      delete next.player.equipment.offhand;
    }
  }
  const maxHp = getPlayerStats(next.player).maxHp;
  next.player.hp = Math.min(maxHp, next.player.hp);
  addLog(
    next,
    'system',
    t('game.message.equipment.equip', {
      item: item.name,
      slot: item.slot ? formatEquipmentSlotLabel(item.slot) : '',
    }),
  );
  return next;
}

export function useItem(state: GameState, itemId: string): GameState {
  return applyInventoryItemUse(state, itemId);
}

export function unequipItem(state: GameState, slot: EquipmentSlot): GameState {
  if (state.gameOver) return state;

  const equipped = state.player.equipment[slot];
  if (!equipped) return message(state, t('game.message.equipment.slotEmpty'));

  const next = cloneForPlayerMutation(state);
  delete next.player.equipment[slot];
  addItemToInventory(next.player.inventory, equipped);
  const maxHp = getPlayerStats(next.player).maxHp;
  next.player.hp = Math.min(maxHp, next.player.hp);
  addLog(
    next,
    'system',
    t('game.message.equipment.unequip', { item: equipped.name }),
  );
  return next;
}

function applyInventoryItemUse(state: GameState, itemId: string): GameState {
  if (state.gameOver) return state;

  const itemIndex = state.player.inventory.findIndex(
    (item) => item.id === itemId,
  );
  if (itemIndex < 0) return message(state, t('game.message.item.notInPack'));

  const item = state.player.inventory[itemIndex];
  if (isRecipePage(item)) {
    if (
      item.recipeId &&
      state.player.learnedRecipeIds.includes(item.recipeId)
    ) {
      return message(
        state,
        t('game.crafting.alreadyKnown', {
          recipe: item.name.replace(/^Recipe: /, ''),
        }),
      );
    }
    const next = cloneForPlayerMutation(state);
    learnRecipe(next, item, RECIPE_BOOK_RECIPES, addLog);
    consumeInventoryItem(next.player.inventory, itemIndex, item);
    return next;
  }
  if (!hasItemTag(item, GAME_TAGS.item.consumable))
    return message(state, t('game.message.item.cannotUse'));
  if ((state.player.consumableCooldownEndsAt ?? 0) > state.worldTimeMs) {
    return message(
      state,
      t('game.message.useItem.cooldown', {
        seconds: formatCooldownSeconds(
          (state.player.consumableCooldownEndsAt ?? 0) - state.worldTimeMs,
        ),
      }),
    );
  }

  const next =
    item.itemKey === ItemId.HomeScroll
      ? cloneForPlayerCombatMutation(state)
      : cloneForPlayerMutation(state);
  if (item.itemKey === ItemId.HomeScroll) {
    startConsumableCooldown(next);
    teleportHome(next, itemIndex, item);
    return next;
  }
  consumeItem(next, itemIndex, item);
  return next;
}

function consumeItem(state: GameState, itemIndex: number, item: Item) {
  const effects = resolveConsumableUseEffects(state, item);
  if (effects.total === 0) {
    addLog(
      state,
      'system',
      t('game.message.useItem.noEffect', { item: item.name }),
    );
    return;
  }

  consumeInventoryItem(state.player.inventory, itemIndex, item);
  startConsumableCooldown(state);
  applyConsumableEffects(state, effects.appliedEffects);
  addLog(
    state,
    'survival',
    t('game.message.useItem', {
      item: item.name,
      healing: formatConsumableLogEffect(effects.appliedEffects, 'healing'),
      mana: formatConsumableLogEffect(effects.appliedEffects, 'mana'),
      hunger: formatConsumableLogEffect(effects.appliedEffects, 'hunger'),
      thirst: formatConsumableLogEffect(effects.appliedEffects, 'thirst'),
    }),
  );
}

function startConsumableCooldown(state: GameState) {
  state.player.consumableCooldownEndsAt =
    state.worldTimeMs + CONSUMABLE_COOLDOWN_MS;
}

function formatCooldownSeconds(remainingMs: number) {
  const seconds = Math.max(0.1, Math.ceil(remainingMs / 100) / 10);
  return Number.isInteger(seconds) ? `${seconds}` : seconds.toFixed(1);
}

function resolveConsumableUseEffects(state: GameState, item: Item) {
  const stats = getPlayerStats(state.player);
  const appliedEffects = getConsumableEffectDescriptors(
    item,
  ).flatMap<AppliedConsumableEffect>((effect) =>
    resolveConsumableEffect(state, stats, effect),
  );

  return {
    appliedEffects,
    total: appliedEffects.reduce((total, effect) => total + effect.amount, 0),
  };
}

function applyConsumableEffects(
  state: GameState,
  appliedEffects: AppliedConsumableEffect[],
) {
  for (const effect of appliedEffects) {
    switch (effect.kind) {
      case 'healing':
        state.player.hp += effect.amount;
        break;
      case 'mana':
        state.player.mana += effect.amount;
        break;
      case 'hunger':
        state.player.hunger += effect.amount;
        break;
      case 'thirst':
        state.player.thirst = (state.player.thirst ?? 100) + effect.amount;
        break;
    }
  }
}

function formatConsumableLogEffect(
  appliedEffects: AppliedConsumableEffect[],
  kind: AppliedConsumableEffect['kind'],
) {
  const effect = appliedEffects.find((candidate) => candidate.kind === kind);
  if (!effect) {
    return '';
  }

  return ` ${t('ui.common.and')} ${t(CONSUMABLE_LOG_EFFECT_KEYS[kind], {
    amount: effect.amount,
  })}`;
}

function resolveConsumableEffect(
  state: GameState,
  stats: ReturnType<typeof getPlayerStats>,
  effect: ConsumableEffectDescriptor,
): AppliedConsumableEffect[] {
  switch (effect.kind) {
    case 'foodRestorePercent': {
      const appliedEffects: AppliedConsumableEffect[] = [];
      const healingEffect = resolvePercentConsumableEffect(
        'healing',
        stats.maxHp,
        state.player.hp,
        effect.amount,
      );
      const manaEffect = resolvePercentConsumableEffect(
        'mana',
        stats.maxMana,
        state.player.mana,
        effect.amount,
      );

      if (healingEffect) {
        appliedEffects.push(healingEffect);
      }
      if (manaEffect) {
        appliedEffects.push(manaEffect);
      }

      return appliedEffects;
    }
    case 'healingPercent': {
      const appliedEffect = resolvePercentConsumableEffect(
        'healing',
        stats.maxHp,
        state.player.hp,
        effect.amount,
      );
      return appliedEffect ? [appliedEffect] : [];
    }
    case 'manaPercent': {
      const appliedEffect = resolvePercentConsumableEffect(
        'mana',
        stats.maxMana,
        state.player.mana,
        effect.amount,
      );
      return appliedEffect ? [appliedEffect] : [];
    }
    case 'hunger': {
      const appliedEffect = resolveFlatConsumableEffect(
        'hunger',
        100,
        state.player.hunger,
        effect.amount,
      );
      return appliedEffect ? [appliedEffect] : [];
    }
    case 'thirst': {
      const appliedEffect = resolveFlatConsumableEffect(
        'thirst',
        100,
        state.player.thirst ?? 100,
        effect.amount,
      );
      return appliedEffect ? [appliedEffect] : [];
    }
    case 'homeScroll':
      return [];
  }
}

function resolvePercentConsumableEffect(
  kind: 'healing' | 'mana',
  maxValue: number,
  currentValue: number,
  percent: number,
) {
  const amount = Math.max(
    0,
    Math.min(
      maxValue - currentValue,
      resolvePercentRestoreAmount(maxValue, percent),
    ),
  );

  return amount > 0 ? { kind, amount } : null;
}

function resolveFlatConsumableEffect(
  kind: 'hunger' | 'thirst',
  maxValue: number,
  currentValue: number,
  amount: number,
) {
  const resolvedAmount = Math.max(0, Math.min(maxValue - currentValue, amount));

  return resolvedAmount > 0 ? { kind, amount: resolvedAmount } : null;
}
