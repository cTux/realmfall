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
  },
} as const;
