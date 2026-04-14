import { Skill, type SkillName } from '../types';
import { EquipmentSlotId, type EquipmentSlotValue } from './ids';

export enum GameTag {
  ItemStackable = 'item.stackable',
  ItemConsumable = 'item.consumable',
  ItemResource = 'item.resource',
  ItemEquipment = 'item.equipment',
  ItemWeapon = 'item.weapon',
  ItemArmor = 'item.armor',
  ItemArtifact = 'item.artifact',
  ItemFood = 'item.food',
  ItemDrink = 'item.drink',
  ItemHealing = 'item.healing',
  ItemRecipe = 'item.recipe',
  ItemRecipeBook = 'item.recipeBook',
  ItemCurrency = 'item.currency',
  ItemProspectable = 'item.prospectable',
  ItemCrafted = 'item.crafted',
  ItemGathered = 'item.gathered',
  ItemAnimalProduct = 'item.animalProduct',
  ItemOre = 'item.ore',
  ItemWood = 'item.wood',
  ItemCloth = 'item.cloth',
  ItemAether = 'item.aether',
  ItemHomeward = 'item.homeward',
  ItemTotem = 'item.totem',
  ItemSlotWeapon = 'item.slot.weapon',
  ItemSlotOffhand = 'item.slot.offhand',
  ItemSlotHead = 'item.slot.head',
  ItemSlotChest = 'item.slot.chest',
  ItemSlotHands = 'item.slot.hands',
  ItemSlotLegs = 'item.slot.legs',
  ItemSlotFeet = 'item.slot.feet',
  ItemSlotRingLeft = 'item.slot.ringLeft',
  ItemSlotRingRight = 'item.slot.ringRight',
  ItemSlotAmulet = 'item.slot.amulet',
  ItemSlotCloak = 'item.slot.cloak',
  ItemSlotRelic = 'item.slot.relic',
  EnemyHostile = 'enemy.hostile',
  EnemyAnimal = 'enemy.animal',
  EnemyBeast = 'enemy.beast',
  EnemyHumanoid = 'enemy.humanoid',
  EnemyAberration = 'enemy.aberration',
  EnemyWorldBoss = 'enemy.worldBoss',
  EnemyElite = 'enemy.elite',
  EnemyDungeon = 'enemy.dungeon',
  AbilityCombat = 'ability.combat',
  AbilityMelee = 'ability.melee',
  AbilityPhysical = 'ability.physical',
  AbilityInstant = 'ability.instant',
  AbilitySingleTarget = 'ability.singleTarget',
  StatusBuff = 'status.buff',
  StatusDebuff = 'status.debuff',
  StatusSurvival = 'status.survival',
  StatusRestoration = 'status.restoration',
  StatusDeath = 'status.death',
  StatusHunger = 'status.hunger',
  StatusThirst = 'status.thirst',
  SkillGathering = 'skill.gathering',
  SkillProfession = 'skill.profession',
  SkillLogging = 'skill.logging',
  SkillMining = 'skill.mining',
  SkillSkinning = 'skill.skinning',
  SkillFishing = 'skill.fishing',
  SkillCooking = 'skill.cooking',
  SkillCrafting = 'skill.crafting',
  StructureUtility = 'structure.utility',
  StructureGathering = 'structure.gathering',
  StructureCrafting = 'structure.crafting',
  StructureSettlement = 'structure.settlement',
  StructureCombat = 'structure.combat',
  StructureCamp = 'structure.camp',
  StructureTown = 'structure.town',
  StructureForge = 'structure.forge',
  StructureWorkshop = 'structure.workshop',
  StructureDungeon = 'structure.dungeon',
  StructureTree = 'structure.tree',
  StructureHerbs = 'structure.herbs',
  StructureOre = 'structure.ore',
  StructureFishing = 'structure.fishing',
}

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
    recipeBook: GameTag.ItemRecipeBook,
    currency: GameTag.ItemCurrency,
    prospectable: GameTag.ItemProspectable,
    crafted: GameTag.ItemCrafted,
    gathered: GameTag.ItemGathered,
    animalProduct: GameTag.ItemAnimalProduct,
    ore: GameTag.ItemOre,
    wood: GameTag.ItemWood,
    cloth: GameTag.ItemCloth,
    aether: GameTag.ItemAether,
    homeward: GameTag.ItemHomeward,
    totem: GameTag.ItemTotem,
    slotWeapon: GameTag.ItemSlotWeapon,
    slotOffhand: GameTag.ItemSlotOffhand,
    slotHead: GameTag.ItemSlotHead,
    slotChest: GameTag.ItemSlotChest,
    slotHands: GameTag.ItemSlotHands,
    slotLegs: GameTag.ItemSlotLegs,
    slotFeet: GameTag.ItemSlotFeet,
    slotRingLeft: GameTag.ItemSlotRingLeft,
    slotRingRight: GameTag.ItemSlotRingRight,
    slotAmulet: GameTag.ItemSlotAmulet,
    slotCloak: GameTag.ItemSlotCloak,
    slotRelic: GameTag.ItemSlotRelic,
  },
  enemy: {
    hostile: GameTag.EnemyHostile,
    animal: GameTag.EnemyAnimal,
    beast: GameTag.EnemyBeast,
    humanoid: GameTag.EnemyHumanoid,
    aberration: GameTag.EnemyAberration,
    worldBoss: GameTag.EnemyWorldBoss,
    elite: GameTag.EnemyElite,
    dungeon: GameTag.EnemyDungeon,
  },
  ability: {
    combat: GameTag.AbilityCombat,
    melee: GameTag.AbilityMelee,
    physical: GameTag.AbilityPhysical,
    instant: GameTag.AbilityInstant,
    singleTarget: GameTag.AbilitySingleTarget,
  },
  status: {
    buff: GameTag.StatusBuff,
    debuff: GameTag.StatusDebuff,
    survival: GameTag.StatusSurvival,
    restoration: GameTag.StatusRestoration,
    death: GameTag.StatusDeath,
    hunger: GameTag.StatusHunger,
    thirst: GameTag.StatusThirst,
  },
  skill: {
    gathering: GameTag.SkillGathering,
    profession: GameTag.SkillProfession,
    logging: GameTag.SkillLogging,
    mining: GameTag.SkillMining,
    skinning: GameTag.SkillSkinning,
    fishing: GameTag.SkillFishing,
    cooking: GameTag.SkillCooking,
    crafting: GameTag.SkillCrafting,
  },
  structure: {
    utility: GameTag.StructureUtility,
    gathering: GameTag.StructureGathering,
    crafting: GameTag.StructureCrafting,
    settlement: GameTag.StructureSettlement,
    combat: GameTag.StructureCombat,
    camp: GameTag.StructureCamp,
    town: GameTag.StructureTown,
    forge: GameTag.StructureForge,
    workshop: GameTag.StructureWorkshop,
    dungeon: GameTag.StructureDungeon,
    tree: GameTag.StructureTree,
    herbs: GameTag.StructureHerbs,
    ore: GameTag.StructureOre,
    fishing: GameTag.StructureFishing,
  },
} as const;

export const ALL_GAME_TAGS = Object.freeze(
  Object.values(GAME_TAGS).flatMap((group) => Object.values(group)),
);

export function uniqueTags(...tags: Array<GameTag | undefined>) {
  return [...new Set(tags.filter(Boolean))] as GameTag[];
}

export function getSkillTags(skill: SkillName) {
  switch (skill) {
    case Skill.Logging:
      return uniqueTags(GAME_TAGS.skill.gathering, GAME_TAGS.skill.logging);
    case Skill.Mining:
      return uniqueTags(GAME_TAGS.skill.gathering, GAME_TAGS.skill.mining);
    case Skill.Skinning:
      return uniqueTags(GAME_TAGS.skill.gathering, GAME_TAGS.skill.skinning);
    case Skill.Fishing:
      return uniqueTags(GAME_TAGS.skill.gathering, GAME_TAGS.skill.fishing);
    case Skill.Cooking:
      return uniqueTags(GAME_TAGS.skill.profession, GAME_TAGS.skill.cooking);
    case Skill.Crafting:
      return uniqueTags(GAME_TAGS.skill.profession, GAME_TAGS.skill.crafting);
  }
}

export function getEquipmentSlotTag(slot: EquipmentSlotValue) {
  switch (slot) {
    case EquipmentSlotId.Weapon:
      return GAME_TAGS.item.slotWeapon;
    case EquipmentSlotId.Offhand:
      return GAME_TAGS.item.slotOffhand;
    case EquipmentSlotId.Head:
      return GAME_TAGS.item.slotHead;
    case EquipmentSlotId.Chest:
      return GAME_TAGS.item.slotChest;
    case EquipmentSlotId.Hands:
      return GAME_TAGS.item.slotHands;
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
