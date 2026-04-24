import { EquipmentSlotId } from '../game/content/ids';
import { Skill } from '../game/types';
import { createGame } from '../game/stateFactory';
import type { Item } from '../game/stateTypes';
import { DEFAULT_WINDOWS } from '../app/constants';

export function createWindowMarkupGame() {
  return createGame(3, 'ui-render-seed');
}

export const equippedWindowItem: Item = {
  id: 'equip-helm',
  slot: EquipmentSlotId.Head,
  name: 'Horned Helm',
  quantity: 1,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 2,
  maxHp: 1,
  healing: 0,
  hunger: 0,
};

export const inventoryWindowItem: Item = {
  id: 'resource-gold',
  name: 'Gold',
  quantity: 12,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
};

export const combatWindowState = {
  coord: { q: 1, r: 0 },
  enemyIds: ['enemy-1'],
  player: {
    abilityIds: ['fireball', 'kick'],
    globalCooldownMs: 1500,
    globalCooldownEndsAt: 900,
    cooldownEndsAt: { kick: 1000, fireball: 4500 },
    casting: {
      abilityId: 'fireball',
      targetId: 'enemy-1',
      endsAt: 500,
    },
  },
  started: false,
  enemies: {
    'enemy-1': {
      abilityIds: ['kick'] as Array<'kick'>,
      globalCooldownMs: 1500,
      globalCooldownEndsAt: 900,
      cooldownEndsAt: { kick: 1000 },
      casting: null,
    },
  },
};

export const recipeWindowSkillLevels = {
  [Skill.Gathering]: 1,
  [Skill.Logging]: 1,
  [Skill.Mining]: 1,
  [Skill.Skinning]: 1,
  [Skill.Fishing]: 1,
  [Skill.Cooking]: 1,
  [Skill.Smelting]: 1,
  [Skill.Crafting]: 1,
};

export function buildBaseHexInfoProps() {
  return {
    position: DEFAULT_WINDOWS.hexInfo,
    onMove: () => {},
    isHome: false,
    onSetHome: () => {},
    terrain: 'Plains',
    structure: null,
    hexDescription: 'A clear stretch of wind-scraped shardland.',
    enemyCount: 0,
    interactLabel: null,
    canInteract: false,
    canTerritoryAction: false,
    territoryActionLabel: 'Cl(a)im',
    canHealTerritoryNpc: false,
    territoryNpcHealExplanation: null,
    territoryActionExplanation: null,
    canBulkProspectEquipment: false,
    canBulkSellEquipment: false,
    bulkProspectEquipmentExplanation: null,
    bulkSellEquipmentExplanation: null,
    onInteract: () => {},
    onTerritoryAction: () => {},
    onHealTerritoryNpc: () => {},
    onProspect: () => {},
    onSellAll: () => {},
    territoryName: null,
    territoryOwnerType: null,
    territoryNpc: null,
    townStock: [],
    gold: 0,
    onBuyItem: () => {},
    onHoverItem: () => {},
    onLeaveItem: () => {},
  };
}
