import { EquipmentSlotId } from './ids';
import {
  MAGICAL_OFFHAND_ABILITY_POOL,
  SHIELD_OFFHAND_ABILITY_POOL,
} from './items/itemAbilityPools';
import type { ItemConfig } from './types';
import { GENERATED_ICON_POOLS } from './generatedIconPools';

export { GENERATED_ICON_POOLS };

type GeneratedEquipmentGroup = 'armor' | 'accessory' | 'weapon' | 'offhand';
type FamilyKey = keyof typeof GENERATED_ICON_POOLS;

interface GeneratedDropDefinition {
  key: ItemConfig['key'];
  slot: ItemConfig['slot'];
  generatedStats: NonNullable<ItemConfig['generatedStats']>;
}

interface GeneratedCraftDefinition {
  keyPrefix: string;
  slot: ItemConfig['slot'];
  tier: number;
  rarity: ItemConfig['rarity'];
  power: number;
  defense: number;
  maxHp: number;
}

export interface GeneratedEquipmentFamilyDefinition {
  familyKey: FamilyKey;
  group: GeneratedEquipmentGroup;
  category: NonNullable<ItemConfig['category']>;
  occupiesOffhand?: boolean;
  grantedAbilityPool?: ItemConfig['grantedAbilityPool'];
  drop?: GeneratedDropDefinition;
  craft?: GeneratedCraftDefinition;
}

export const GENERATED_EQUIPMENT_FAMILIES = [
  {
    familyKey: 'helmet',
    group: 'armor',
    category: 'armor',
    drop: {
      key: 'generated-helmet',
      slot: EquipmentSlotId.Head,
      generatedStats: {
        baseDefense: 1,
        defensePerTier: 1,
        baseMaxHp: 1,
        maxHpPerTier: 1,
      },
    },
    craft: {
      keyPrefix: 'icon-helmet',
      slot: EquipmentSlotId.Head,
      tier: 2,
      rarity: 'common',
      power: 0,
      defense: 2,
      maxHp: 1,
    },
  },
  {
    familyKey: 'shoulders',
    group: 'armor',
    category: 'armor',
    drop: {
      key: 'generated-shoulders',
      slot: EquipmentSlotId.Shoulders,
      generatedStats: {
        baseDefense: 1,
        defensePerTier: 1,
        baseMaxHp: 1,
        maxHpPerTier: 1,
      },
    },
    craft: {
      keyPrefix: 'icon-shoulders',
      slot: EquipmentSlotId.Shoulders,
      tier: 2,
      rarity: 'common',
      power: 0,
      defense: 2,
      maxHp: 1,
    },
  },
  {
    familyKey: 'chest',
    group: 'armor',
    category: 'armor',
    drop: {
      key: 'generated-chest',
      slot: EquipmentSlotId.Chest,
      generatedStats: {
        baseDefense: 2,
        defensePerTier: 1,
        baseMaxHp: 2,
        maxHpPerTier: 2,
      },
    },
    craft: {
      keyPrefix: 'icon-chest',
      slot: EquipmentSlotId.Chest,
      tier: 3,
      rarity: 'common',
      power: 0,
      defense: 3,
      maxHp: 2,
    },
  },
  {
    familyKey: 'bracers',
    group: 'armor',
    category: 'armor',
    drop: {
      key: 'generated-bracers',
      slot: EquipmentSlotId.Bracers,
      generatedStats: {
        baseDefense: 1,
        defensePerTier: 1,
        baseMaxHp: 0,
        maxHpPerTier: 1,
      },
    },
    craft: {
      keyPrefix: 'icon-bracers',
      slot: EquipmentSlotId.Bracers,
      tier: 2,
      rarity: 'common',
      power: 0,
      defense: 1,
      maxHp: 1,
    },
  },
  {
    familyKey: 'gloves',
    group: 'armor',
    category: 'armor',
    drop: {
      key: 'generated-gloves',
      slot: EquipmentSlotId.Hands,
      generatedStats: {
        baseDefense: 1,
        defensePerTier: 1,
        baseMaxHp: 0,
        maxHpPerTier: 1,
      },
    },
    craft: {
      keyPrefix: 'icon-gloves',
      slot: EquipmentSlotId.Hands,
      tier: 2,
      rarity: 'common',
      power: 0,
      defense: 1,
      maxHp: 1,
    },
  },
  {
    familyKey: 'belt',
    group: 'armor',
    category: 'armor',
    drop: {
      key: 'generated-belt',
      slot: EquipmentSlotId.Belt,
      generatedStats: {
        baseDefense: 1,
        defensePerTier: 1,
        baseMaxHp: 1,
        maxHpPerTier: 1,
      },
    },
    craft: {
      keyPrefix: 'icon-belt',
      slot: EquipmentSlotId.Belt,
      tier: 2,
      rarity: 'common',
      power: 0,
      defense: 1,
      maxHp: 1,
    },
  },
  {
    familyKey: 'leggings',
    group: 'armor',
    category: 'armor',
    drop: {
      key: 'generated-leggings',
      slot: EquipmentSlotId.Legs,
      generatedStats: {
        baseDefense: 1,
        defensePerTier: 1,
        baseMaxHp: 1,
        maxHpPerTier: 1,
      },
    },
    craft: {
      keyPrefix: 'icon-leggings',
      slot: EquipmentSlotId.Legs,
      tier: 2,
      rarity: 'common',
      power: 0,
      defense: 2,
      maxHp: 1,
    },
  },
  {
    familyKey: 'feet',
    group: 'armor',
    category: 'armor',
    drop: {
      key: 'generated-boots',
      slot: EquipmentSlotId.Feet,
      generatedStats: {
        baseDefense: 1,
        defensePerTier: 1,
        baseMaxHp: 0,
        maxHpPerTier: 1,
      },
    },
    craft: {
      keyPrefix: 'icon-boots',
      slot: EquipmentSlotId.Feet,
      tier: 2,
      rarity: 'common',
      power: 0,
      defense: 1,
      maxHp: 1,
    },
  },
  {
    familyKey: 'cloak',
    group: 'armor',
    category: 'armor',
    drop: {
      key: 'generated-cloak',
      slot: EquipmentSlotId.Cloak,
      generatedStats: {
        basePower: 1,
        powerPerTier: 1,
        baseDefense: 1,
        defensePerTier: 1,
        baseMaxHp: 1,
        maxHpPerTier: 1,
        randomMainStatPool: ['power', 'defense', 'maxHp'],
        randomMainStatCount: 2,
      },
    },
    craft: {
      keyPrefix: 'icon-cloak',
      slot: EquipmentSlotId.Cloak,
      tier: 2,
      rarity: 'common',
      power: 0,
      defense: 1,
      maxHp: 2,
    },
  },
  {
    familyKey: 'ring',
    group: 'accessory',
    category: 'artifact',
    drop: {
      key: 'generated-ring-left',
      slot: EquipmentSlotId.RingLeft,
      generatedStats: {
        basePower: 1,
        powerPerTier: 1,
        baseDefense: 1,
        defensePerTier: 1,
        baseMaxHp: 1,
        maxHpPerTier: 1,
        randomMainStatPool: ['power', 'defense', 'maxHp'],
        randomMainStatCount: 2,
      },
    },
    craft: {
      keyPrefix: 'icon-ring',
      slot: EquipmentSlotId.RingLeft,
      tier: 3,
      rarity: 'uncommon',
      power: 2,
      defense: 0,
      maxHp: 2,
    },
  },
  {
    familyKey: 'ring',
    group: 'accessory',
    category: 'artifact',
    drop: {
      key: 'generated-ring-right',
      slot: EquipmentSlotId.RingRight,
      generatedStats: {
        basePower: 1,
        powerPerTier: 1,
        baseDefense: 1,
        defensePerTier: 1,
        baseMaxHp: 1,
        maxHpPerTier: 1,
        randomMainStatPool: ['power', 'defense', 'maxHp'],
        randomMainStatCount: 2,
      },
    },
  },
  {
    familyKey: 'necklace',
    group: 'accessory',
    category: 'artifact',
    drop: {
      key: 'generated-necklace',
      slot: EquipmentSlotId.Amulet,
      generatedStats: {
        basePower: 1,
        powerPerTier: 1,
        baseDefense: 1,
        defensePerTier: 1,
        baseMaxHp: 2,
        maxHpPerTier: 2,
        randomMainStatPool: ['power', 'defense', 'maxHp'],
        randomMainStatCount: 2,
      },
    },
    craft: {
      keyPrefix: 'icon-necklace',
      slot: EquipmentSlotId.Amulet,
      tier: 3,
      rarity: 'uncommon',
      power: 1,
      defense: 1,
      maxHp: 3,
    },
  },
  {
    familyKey: 'axe',
    group: 'weapon',
    category: 'weapon',
    drop: {
      key: 'generated-axe',
      slot: EquipmentSlotId.Weapon,
      generatedStats: {
        basePower: 3,
        powerPerTier: 2,
      },
    },
    craft: {
      keyPrefix: 'icon-axe',
      slot: EquipmentSlotId.Weapon,
      tier: 3,
      rarity: 'common',
      power: 5,
      defense: 0,
      maxHp: 0,
    },
    grantedAbilityPool: ['crushingBlow', 'whirlwind', 'magmaStrike'],
  },
  {
    familyKey: 'sword',
    group: 'weapon',
    category: 'weapon',
    drop: {
      key: 'generated-sword',
      slot: EquipmentSlotId.Weapon,
      generatedStats: {
        basePower: 3,
        powerPerTier: 2,
      },
    },
    craft: {
      keyPrefix: 'icon-sword',
      slot: EquipmentSlotId.Weapon,
      tier: 3,
      rarity: 'common',
      power: 5,
      defense: 0,
      maxHp: 0,
    },
    grantedAbilityPool: ['slash', 'impale', 'iceLance'],
  },
  {
    familyKey: 'mace',
    group: 'weapon',
    category: 'weapon',
    drop: {
      key: 'generated-mace',
      slot: EquipmentSlotId.Weapon,
      generatedStats: {
        basePower: 3,
        powerPerTier: 2,
      },
    },
    craft: {
      keyPrefix: 'icon-mace',
      slot: EquipmentSlotId.Weapon,
      tier: 3,
      rarity: 'common',
      power: 5,
      defense: 0,
      maxHp: 1,
    },
    grantedAbilityPool: ['crushingBlow', 'thunderClap', 'staticField'],
  },
  {
    familyKey: 'dagger',
    group: 'weapon',
    category: 'weapon',
    drop: {
      key: 'generated-dagger',
      slot: EquipmentSlotId.Weapon,
      generatedStats: {
        basePower: 2,
        powerPerTier: 2,
      },
    },
    craft: {
      keyPrefix: 'icon-dagger',
      slot: EquipmentSlotId.Weapon,
      tier: 2,
      rarity: 'common',
      power: 4,
      defense: 0,
      maxHp: 0,
    },
    grantedAbilityPool: ['slash', 'hamstring', 'cinderBurst'],
  },
  {
    familyKey: 'wand',
    group: 'weapon',
    category: 'weapon',
    drop: {
      key: 'generated-wand',
      slot: EquipmentSlotId.Weapon,
      generatedStats: {
        basePower: 4,
        powerPerTier: 2,
      },
    },
    craft: {
      keyPrefix: 'icon-wand',
      slot: EquipmentSlotId.Weapon,
      tier: 3,
      rarity: 'uncommon',
      power: 6,
      defense: 0,
      maxHp: 0,
    },
    grantedAbilityPool: ['fireball', 'chainLightning', 'iceLance', 'searingNova'],
  },
  {
    familyKey: 'dagger',
    group: 'offhand',
    category: 'weapon',
    drop: {
      key: 'generated-offhand-dagger',
      slot: EquipmentSlotId.Offhand,
      generatedStats: {
        basePower: 2,
        powerPerTier: 1,
      },
    },
    grantedAbilityPool: ['hamstring', 'slash', 'sunderArmor'],
  },
  {
    familyKey: 'magicalSphere',
    group: 'offhand',
    category: 'artifact',
    drop: {
      key: 'generated-magical-sphere',
      slot: EquipmentSlotId.Offhand,
      generatedStats: {
        baseDefense: 1,
        defensePerTier: 1,
        baseMaxHp: 1,
        maxHpPerTier: 1,
      },
    },
    craft: {
      keyPrefix: 'icon-magical-sphere',
      slot: EquipmentSlotId.Offhand,
      tier: 4,
      rarity: 'uncommon',
      power: 2,
      defense: 0,
      maxHp: 3,
    },
    grantedAbilityPool: MAGICAL_OFFHAND_ABILITY_POOL,
  },
  {
    familyKey: 'shield',
    group: 'offhand',
    category: 'armor',
    drop: {
      key: 'generated-shield',
      slot: EquipmentSlotId.Offhand,
      generatedStats: {
        baseDefense: 2,
        defensePerTier: 2,
        baseMaxHp: 1,
        maxHpPerTier: 1,
      },
    },
    craft: {
      keyPrefix: 'icon-shield',
      slot: EquipmentSlotId.Offhand,
      tier: 3,
      rarity: 'common',
      power: 0,
      defense: 4,
      maxHp: 2,
    },
    grantedAbilityPool: SHIELD_OFFHAND_ABILITY_POOL,
  },
  {
    familyKey: 'twoHandedSword',
    group: 'weapon',
    category: 'weapon',
    occupiesOffhand: true,
    drop: {
      key: 'generated-two-handed-sword',
      slot: EquipmentSlotId.Weapon,
      generatedStats: {
        basePower: 6,
        powerPerTier: 4,
      },
    },
    craft: {
      keyPrefix: 'icon-two-handed-sword',
      slot: EquipmentSlotId.Weapon,
      tier: 4,
      rarity: 'uncommon',
      power: 8,
      defense: 0,
      maxHp: 2,
    },
    grantedAbilityPool: ['whirlwind', 'impale', 'blizzard'],
  },
  {
    familyKey: 'twoHandedAxe',
    group: 'weapon',
    category: 'weapon',
    occupiesOffhand: true,
    drop: {
      key: 'generated-two-handed-axe',
      slot: EquipmentSlotId.Weapon,
      generatedStats: {
        basePower: 6,
        powerPerTier: 4,
      },
    },
    craft: {
      keyPrefix: 'icon-two-handed-axe',
      slot: EquipmentSlotId.Weapon,
      tier: 4,
      rarity: 'uncommon',
      power: 8,
      defense: 0,
      maxHp: 2,
    },
    grantedAbilityPool: ['whirlwind', 'magmaStrike', 'wildfire'],
  },
  {
    familyKey: 'twoHandedMace',
    group: 'weapon',
    category: 'weapon',
    occupiesOffhand: true,
    drop: {
      key: 'generated-two-handed-mace',
      slot: EquipmentSlotId.Weapon,
      generatedStats: {
        basePower: 6,
        powerPerTier: 4,
      },
    },
    craft: {
      keyPrefix: 'icon-two-handed-mace',
      slot: EquipmentSlotId.Weapon,
      tier: 4,
      rarity: 'uncommon',
      power: 8,
      defense: 0,
      maxHp: 3,
    },
    grantedAbilityPool: ['stormSurge', 'thunderClap', 'crushingBlow'],
  },
] as const satisfies readonly GeneratedEquipmentFamilyDefinition[];
