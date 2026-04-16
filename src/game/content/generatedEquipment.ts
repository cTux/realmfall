import { itemName } from './i18n';
import { EquipmentSlotId } from './ids';
import type { ItemConfig } from './types';

const gameIcon = (pageUrl: string) =>
  pageUrl
    .replace('http://', 'https://')
    .replace('/1x1/', '/icons/ffffff/000000/1x1/')
    .replace('.html', '.svg');

export const GENERATED_ICON_POOLS = {
  shoulders: [
    gameIcon(
      'https://game-icons.net/1x1/delapouite/spiked-shoulder-armor.html',
    ),
    gameIcon('https://game-icons.net/1x1/lorc/shoulder-scales.html'),
    gameIcon('https://game-icons.net/1x1/skoll/pauldrons.html'),
  ],
  belt: [
    gameIcon('https://game-icons.net/1x1/lucasms/belt.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/belt-armor.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/black-belt.html'),
  ],
  bracers: [
    gameIcon('https://game-icons.net/1x1/skoll/bracers.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/bracer.html'),
  ],
  cloak: [
    gameIcon('https://game-icons.net/1x1/lucasms/cloak.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/cape.html'),
    gameIcon('https://game-icons.net/1x1/lorc/wing-cloak.html'),
  ],
  helmet: [
    gameIcon('https://game-icons.net/1x1/delapouite/viking-helmet.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/spartan-helmet.html'),
    gameIcon('https://game-icons.net/1x1/kier-heyl/dwarf-helmet.html'),
    gameIcon('https://game-icons.net/1x1/lorc/crested-helmet.html'),
    gameIcon('https://game-icons.net/1x1/lorc/visored-helm.html'),
    gameIcon('https://game-icons.net/1x1/kier-heyl/elf-helmet.html'),
    gameIcon('https://game-icons.net/1x1/carl-olsen/brutal-helm.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/light-helm.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/closed-barbute.html'),
    gameIcon('https://game-icons.net/1x1/caro-asercion/warlord-helmet.html'),
    gameIcon('https://game-icons.net/1x1/lorc/horned-helm.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/centurion-helmet.html'),
  ],
  chest: [
    gameIcon('https://game-icons.net/1x1/delapouite/chest-armor.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/leather-armor.html'),
    gameIcon('https://game-icons.net/1x1/lorc/breastplate.html'),
    gameIcon('https://game-icons.net/1x1/lorc/lamellar.html'),
  ],
  gloves: [
    gameIcon('https://game-icons.net/1x1/delapouite/gloves.html'),
    gameIcon('https://game-icons.net/1x1/lorc/mailed-fist.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/gauntlet.html'),
  ],
  axe: [
    gameIcon('https://game-icons.net/1x1/delapouite/magic-axe.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/sharp-axe.html'),
    gameIcon('https://game-icons.net/1x1/lorc/battle-axe.html'),
    gameIcon('https://game-icons.net/1x1/lorc/stone-axe.html'),
    gameIcon('https://game-icons.net/1x1/lorc/fire-axe.html'),
    gameIcon('https://game-icons.net/1x1/lorc/battered-axe.html'),
    gameIcon('https://game-icons.net/1x1/lorc/wood-axe.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/tomahawk.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/hatchet.html'),
  ],
  sword: [
    gameIcon('https://game-icons.net/1x1/lorc/shard-sword.html'),
    gameIcon('https://game-icons.net/1x1/lorc/croc-sword.html'),
    gameIcon('https://game-icons.net/1x1/lorc/bloody-sword.html'),
    gameIcon('https://game-icons.net/1x1/lorc/fragmented-sword.html'),
    gameIcon('https://game-icons.net/1x1/lorc/piercing-sword.html'),
    gameIcon('https://game-icons.net/1x1/lorc/energy-sword.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/glaive.html'),
    gameIcon('https://game-icons.net/1x1/lorc/broadsword.html'),
    gameIcon('https://game-icons.net/1x1/lorc/relic-blade.html'),
    gameIcon('https://game-icons.net/1x1/skoll/gladius.html'),
  ],
  mace: [
    gameIcon('https://game-icons.net/1x1/delapouite/bone-mace.html'),
    gameIcon('https://game-icons.net/1x1/lorc/spiked-mace.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/flanged-mace.html'),
  ],
  dagger: [
    gameIcon('https://game-icons.net/1x1/lorc/plain-dagger.html'),
    gameIcon('https://game-icons.net/1x1/lorc/sacrificial-dagger.html'),
    gameIcon('https://game-icons.net/1x1/lorc/broad-dagger.html'),
  ],
  wand: [
    gameIcon('https://game-icons.net/1x1/delapouite/lunar-wand.html'),
    gameIcon('https://game-icons.net/1x1/lorc/crystal-wand.html'),
    gameIcon('https://game-icons.net/1x1/willdabeast/orb-wand.html'),
  ],
  magicalSphere: [
    gameIcon('https://game-icons.net/1x1/lorc/stone-sphere.html'),
    gameIcon('https://game-icons.net/1x1/lorc/crumbling-ball.html'),
    gameIcon('https://game-icons.net/1x1/lorc/frozen-orb.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/dragon-orb.html'),
    gameIcon('https://game-icons.net/1x1/lorc/extraction-orb.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/glass-ball.html'),
  ],
  twoHandedSword: [
    gameIcon('https://game-icons.net/1x1/delapouite/two-handed-sword.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/hook-swords.html'),
    gameIcon('https://game-icons.net/1x1/lorc/dervish-swords.html'),
  ],
  twoHandedAxe: [
    gameIcon('https://game-icons.net/1x1/delapouite/axe-sword.html'),
    gameIcon('https://game-icons.net/1x1/lorc/crossed-axes.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/war-axe.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/sharp-halberd.html'),
    gameIcon('https://game-icons.net/1x1/lorc/halberd.html'),
  ],
  twoHandedMace: [
    gameIcon('https://game-icons.net/1x1/delapouite/toy-mallet.html'),
  ],
  shield: [
    gameIcon('https://game-icons.net/1x1/willdabeast/round-shield.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/griffin-shield.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/vibrating-shield.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/dragon-shield.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/tribal-shield.html'),
    gameIcon('https://game-icons.net/1x1/lorc/checked-shield.html'),
    gameIcon('https://game-icons.net/1x1/lorc/fire-shield.html'),
    gameIcon('https://game-icons.net/1x1/lorc/rosa-shield.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/cross-shield.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/viking-shield.html'),
  ],
  leggings: [
    gameIcon('https://game-icons.net/1x1/lorc/trousers.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/greaves.html'),
    gameIcon('https://game-icons.net/1x1/irongamer/armored-pants.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/skirt.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/armor-cuisses.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/loincloth.html'),
  ],
  feet: [
    gameIcon('https://game-icons.net/1x1/delapouite/leg-armor.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/sandal.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/foot-plaster.html'),
    gameIcon('https://game-icons.net/1x1/lorc/boots.html'),
    gameIcon('https://game-icons.net/1x1/lorc/leather-boot.html'),
    gameIcon('https://game-icons.net/1x1/lorc/walking-boot.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/cowboy-boot.html'),
    gameIcon('https://game-icons.net/1x1/darkzaitzev/tabi-boot.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/fur-boot.html'),
    gameIcon('https://game-icons.net/1x1/lorc/steeltoe-boots.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/metal-boot.html'),
  ],
  ring: [
    gameIcon('https://game-icons.net/1x1/delapouite/ring.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/power-ring.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/globe-ring.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/frozen-ring.html'),
    gameIcon('https://game-icons.net/1x1/lorc/skull-ring.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/diamond-ring.html'),
    gameIcon('https://game-icons.net/1x1/skoll/big-diamond-ring.html'),
  ],
  necklace: [
    gameIcon('https://game-icons.net/1x1/lucasms/necklace.html'),
    gameIcon('https://game-icons.net/1x1/lorc/gem-necklace.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/feather-necklace.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/double-necklace.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/emerald-necklace.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/heart-necklace.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/primitive-necklace.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/pearl-necklace.html'),
    gameIcon('https://game-icons.net/1x1/delapouite/tribal-pendant.html'),
    gameIcon('https://game-icons.net/1x1/lorc/gem-pendant.html'),
  ],
} as const;

const generated = (
  key: string,
  slot: ItemConfig['slot'],
  category: NonNullable<ItemConfig['category']>,
  iconPool: readonly string[],
  generatedStats: NonNullable<ItemConfig['generatedStats']>,
  occupiesOffhand = false,
): ItemConfig => ({
  key,
  name: itemName(key),
  slot,
  icon: iconPool[0] ?? '',
  iconPool: [...iconPool],
  category,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  thirst: 0,
  occupiesOffhand,
  generatedStats,
});

export const GENERATED_EQUIPMENT_CONFIGS: ItemConfig[] = [
  generated('generated-helmet', EquipmentSlotId.Head, 'armor', GENERATED_ICON_POOLS.helmet, {
    baseDefense: 1,
    defensePerTier: 1,
    baseMaxHp: 1,
    maxHpPerTier: 1,
  }),
  generated('generated-shoulders', EquipmentSlotId.Shoulders, 'armor', GENERATED_ICON_POOLS.shoulders, {
    baseDefense: 1,
    defensePerTier: 1,
    baseMaxHp: 1,
    maxHpPerTier: 1,
  }),
  generated('generated-chest', EquipmentSlotId.Chest, 'armor', GENERATED_ICON_POOLS.chest, {
    baseDefense: 2,
    defensePerTier: 1,
    baseMaxHp: 2,
    maxHpPerTier: 2,
  }),
  generated('generated-bracers', EquipmentSlotId.Bracers, 'armor', GENERATED_ICON_POOLS.bracers, {
    baseDefense: 1,
    defensePerTier: 1,
    baseMaxHp: 0,
    maxHpPerTier: 1,
  }),
  generated('generated-gloves', EquipmentSlotId.Hands, 'armor', GENERATED_ICON_POOLS.gloves, {
    baseDefense: 1,
    defensePerTier: 1,
    baseMaxHp: 0,
    maxHpPerTier: 1,
  }),
  generated('generated-belt', EquipmentSlotId.Belt, 'armor', GENERATED_ICON_POOLS.belt, {
    baseDefense: 1,
    defensePerTier: 1,
    baseMaxHp: 1,
    maxHpPerTier: 1,
  }),
  generated('generated-leggings', EquipmentSlotId.Legs, 'armor', GENERATED_ICON_POOLS.leggings, {
    baseDefense: 1,
    defensePerTier: 1,
    baseMaxHp: 1,
    maxHpPerTier: 1,
  }),
  generated('generated-boots', EquipmentSlotId.Feet, 'armor', GENERATED_ICON_POOLS.feet, {
    baseDefense: 1,
    defensePerTier: 1,
    baseMaxHp: 0,
    maxHpPerTier: 1,
  }),
  generated('generated-cloak', EquipmentSlotId.Cloak, 'armor', GENERATED_ICON_POOLS.cloak, {
    baseDefense: 1,
    defensePerTier: 1,
    baseMaxHp: 1,
    maxHpPerTier: 1,
  }),
  generated('generated-ring-left', EquipmentSlotId.RingLeft, 'artifact', GENERATED_ICON_POOLS.ring, {
    basePower: 1,
    powerPerTier: 1,
    baseMaxHp: 1,
    maxHpPerTier: 1,
  }),
  generated('generated-ring-right', EquipmentSlotId.RingRight, 'artifact', GENERATED_ICON_POOLS.ring, {
    basePower: 1,
    powerPerTier: 1,
    baseMaxHp: 1,
    maxHpPerTier: 1,
  }),
  generated('generated-necklace', EquipmentSlotId.Amulet, 'artifact', GENERATED_ICON_POOLS.necklace, {
    baseDefense: 1,
    defensePerTier: 1,
    baseMaxHp: 2,
    maxHpPerTier: 2,
  }),
  generated('generated-axe', EquipmentSlotId.Weapon, 'weapon', GENERATED_ICON_POOLS.axe, {
    basePower: 3,
    powerPerTier: 2,
  }),
  generated('generated-sword', EquipmentSlotId.Weapon, 'weapon', GENERATED_ICON_POOLS.sword, {
    basePower: 3,
    powerPerTier: 2,
  }),
  generated('generated-mace', EquipmentSlotId.Weapon, 'weapon', GENERATED_ICON_POOLS.mace, {
    basePower: 3,
    powerPerTier: 2,
    baseMaxHp: 1,
    maxHpPerTier: 1,
  }),
  generated('generated-dagger', EquipmentSlotId.Weapon, 'weapon', GENERATED_ICON_POOLS.dagger, {
    basePower: 2,
    powerPerTier: 2,
  }),
  generated('generated-wand', EquipmentSlotId.Weapon, 'weapon', GENERATED_ICON_POOLS.wand, {
    basePower: 4,
    powerPerTier: 2,
  }),
  generated('generated-offhand-dagger', EquipmentSlotId.Offhand, 'weapon', GENERATED_ICON_POOLS.dagger, {
    basePower: 2,
    powerPerTier: 1,
  }),
  generated('generated-magical-sphere', EquipmentSlotId.Offhand, 'artifact', GENERATED_ICON_POOLS.magicalSphere, {
    basePower: 1,
    powerPerTier: 1,
    baseMaxHp: 1,
    maxHpPerTier: 2,
  }),
  generated('generated-shield', EquipmentSlotId.Offhand, 'armor', GENERATED_ICON_POOLS.shield, {
    baseDefense: 2,
    defensePerTier: 2,
    baseMaxHp: 1,
    maxHpPerTier: 1,
  }),
  generated('generated-two-handed-sword', EquipmentSlotId.Weapon, 'weapon', GENERATED_ICON_POOLS.twoHandedSword, {
    basePower: 6,
    powerPerTier: 4,
    baseMaxHp: 2,
    maxHpPerTier: 2,
  }, true),
  generated('generated-two-handed-axe', EquipmentSlotId.Weapon, 'weapon', GENERATED_ICON_POOLS.twoHandedAxe, {
    basePower: 6,
    powerPerTier: 4,
    baseMaxHp: 2,
    maxHpPerTier: 2,
  }, true),
  generated('generated-two-handed-mace', EquipmentSlotId.Weapon, 'weapon', GENERATED_ICON_POOLS.twoHandedMace, {
    basePower: 6,
    powerPerTier: 4,
    baseMaxHp: 3,
    maxHpPerTier: 2,
  }, true),
];

export const GENERATED_ARMOR_KEYS = [
  'generated-helmet',
  'generated-shoulders',
  'generated-chest',
  'generated-bracers',
  'generated-gloves',
  'generated-belt',
  'generated-leggings',
  'generated-boots',
  'generated-cloak',
] as const;

export const GENERATED_ACCESSORY_KEYS = [
  'generated-ring-left',
  'generated-ring-right',
  'generated-necklace',
] as const;

export const GENERATED_WEAPON_KEYS = [
  'generated-axe',
  'generated-sword',
  'generated-mace',
  'generated-dagger',
  'generated-wand',
  'generated-two-handed-sword',
  'generated-two-handed-axe',
  'generated-two-handed-mace',
] as const;

export const GENERATED_OFFHAND_KEYS = [
  'generated-shield',
  'generated-offhand-dagger',
  'generated-magical-sphere',
] as const;
