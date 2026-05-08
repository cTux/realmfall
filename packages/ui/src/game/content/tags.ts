import { EquipmentSlotId, type EquipmentSlotValue } from './ids';

export const GameTag = {
  ItemStackable: 'item.stackable',
  ItemConsumable: 'item.consumable',
  ItemResource: 'item.resource',
  ItemEquipment: 'item.equipment',
  ItemWeapon: 'item.weapon',
  ItemArmor: 'item.armor',
  ItemArtifact: 'item.artifact',
  ItemFood: 'item.food',
  ItemDrink: 'item.drink',
  ItemHealing: 'item.healing',
  ItemRecipe: 'item.recipe',
  ItemTotem: 'item.totem',
  ItemMana: 'item.mana',
  ItemWood: 'item.wood',
  ItemAnimalProduct: 'item.animalProduct',
  ItemCloth: 'item.cloth',
  ItemOre: 'item.ore',
  ItemSlotWeapon: 'item.slot.weapon',
  ItemSlotOffhand: 'item.slot.offhand',
  ItemSlotHead: 'item.slot.head',
  ItemSlotShoulders: 'item.slot.shoulders',
  ItemSlotChest: 'item.slot.chest',
  ItemSlotBracers: 'item.slot.bracers',
  ItemSlotHands: 'item.slot.hands',
  ItemSlotBelt: 'item.slot.belt',
  ItemSlotLegs: 'item.slot.legs',
  ItemSlotFeet: 'item.slot.feet',
  ItemSlotRingLeft: 'item.slot.ringLeft',
  ItemSlotRingRight: 'item.slot.ringRight',
  ItemSlotAmulet: 'item.slot.amulet',
  ItemSlotCloak: 'item.slot.cloak',
  ItemSlotRelic: 'item.slot.relic',
} as const;

export type GameTag = string;

export const GAME_TAGS = {
  item: {
    stackable: GameTag.ItemStackable,
    consumable: GameTag.ItemConsumable,
    resource: GameTag.ItemResource,
    equipment: GameTag.ItemEquipment,
    weapon: GameTag.ItemWeapon,
    armor: GameTag.ItemArmor,
    artifact: GameTag.ItemArtifact,
    food: GameTag.ItemFood,
    drink: GameTag.ItemDrink,
    healing: GameTag.ItemHealing,
    recipe: GameTag.ItemRecipe,
    totem: GameTag.ItemTotem,
    mana: GameTag.ItemMana,
    wood: GameTag.ItemWood,
    animalProduct: GameTag.ItemAnimalProduct,
    cloth: GameTag.ItemCloth,
    ore: GameTag.ItemOre,
    slotWeapon: GameTag.ItemSlotWeapon,
    slotOffhand: GameTag.ItemSlotOffhand,
    slotHead: GameTag.ItemSlotHead,
    slotShoulders: GameTag.ItemSlotShoulders,
    slotChest: GameTag.ItemSlotChest,
    slotBracers: GameTag.ItemSlotBracers,
    slotHands: GameTag.ItemSlotHands,
    slotBelt: GameTag.ItemSlotBelt,
    slotLegs: GameTag.ItemSlotLegs,
    slotFeet: GameTag.ItemSlotFeet,
    slotRingLeft: GameTag.ItemSlotRingLeft,
    slotRingRight: GameTag.ItemSlotRingRight,
    slotAmulet: GameTag.ItemSlotAmulet,
    slotCloak: GameTag.ItemSlotCloak,
    slotRelic: GameTag.ItemSlotRelic,
  },
} as const;

export function uniqueTags(...tags: Array<GameTag | undefined>) {
  return [...new Set(tags.filter(Boolean) as GameTag[])];
}

export function getEquipmentSlotTag(slot: EquipmentSlotValue) {
  switch (slot) {
    case EquipmentSlotId.Weapon:
      return GAME_TAGS.item.slotWeapon;
    case EquipmentSlotId.Offhand:
      return GAME_TAGS.item.slotOffhand;
    case EquipmentSlotId.Head:
      return GAME_TAGS.item.slotHead;
    case EquipmentSlotId.Shoulders:
      return GAME_TAGS.item.slotShoulders;
    case EquipmentSlotId.Chest:
      return GAME_TAGS.item.slotChest;
    case EquipmentSlotId.Bracers:
      return GAME_TAGS.item.slotBracers;
    case EquipmentSlotId.Hands:
      return GAME_TAGS.item.slotHands;
    case EquipmentSlotId.Belt:
      return GAME_TAGS.item.slotBelt;
    case EquipmentSlotId.Legs:
      return GAME_TAGS.item.slotLegs;
    case EquipmentSlotId.Feet:
      return GAME_TAGS.item.slotFeet;
    case EquipmentSlotId.RingLeft:
      return GAME_TAGS.item.slotRingLeft;
    case EquipmentSlotId.RingRight:
      return GAME_TAGS.item.slotRingRight;
    case EquipmentSlotId.Amulet:
      return GAME_TAGS.item.slotAmulet;
    case EquipmentSlotId.Cloak:
      return GAME_TAGS.item.slotCloak;
    case EquipmentSlotId.Relic:
      return GAME_TAGS.item.slotRelic;
  }
}
