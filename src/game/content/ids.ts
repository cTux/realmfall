export enum ItemId {
  TrailRation = 'trail-ration',
  Apple = 'apple',
  RecipeBook = 'recipe-book',
  HealthPotion = 'health-potion',
  ManaPotion = 'mana-potion',
  CookedFish = 'cooked-fish',
  HomeScroll = 'home-scroll',
  Gold = 'gold',
  Herbs = 'herbs',
  Logs = 'logs',
  Sticks = 'sticks',
  Stone = 'stone',
  CopperOre = 'copper-ore',
  IronOre = 'iron-ore',
  IronChunks = 'iron-chunks',
  Coal = 'coal',
  RawFish = 'raw-fish',
  Cloth = 'cloth',
  LeatherScraps = 'leather-scraps',
  ArcaneDust = 'arcane-dust',
  TownKnife = 'town-knife',
  ScoutHood = 'scout-hood',
  CampSpear = 'camp-spear',
  HideBuckler = 'hide-buckler',
  PatchworkHood = 'patchwork-hood',
  SettlerVest = 'settler-vest',
  WorkGloves = 'work-gloves',
  TrailLeggings = 'trail-leggings',
  FieldBoots = 'field-boots',
  CopperLoop = 'copper-loop',
  CopperBand = 'copper-band',
  CharmNecklace = 'charm-necklace',
  WayfarerCloak = 'wayfarer-cloak',
  HearthTotem = 'hearth-totem',
  WaterFlask = 'water-flask',
}

export type ItemKey = string;

export enum EnemyTypeId {
  Gluttony = 'gluttony',
  Raider = 'raider',
  Marauder = 'marauder',
  Wolf = 'wolf',
  Boar = 'boar',
  Stag = 'stag',
  Spider = 'spider',
}

export type EnemyTypeKey = `${EnemyTypeId}`;

export enum StatusEffectTypeId {
  Hunger = 'hunger',
  Thirst = 'thirst',
  RecentDeath = 'recentDeath',
  Restoration = 'restoration',
}

export type StatusEffectIdValue = `${StatusEffectTypeId}`;

export enum EquipmentSlotId {
  Weapon = 'weapon',
  Offhand = 'offhand',
  Head = 'head',
  Shoulders = 'shoulders',
  Chest = 'chest',
  Bracers = 'bracers',
  Hands = 'hands',
  Belt = 'belt',
  Legs = 'legs',
  Feet = 'feet',
  RingLeft = 'ringLeft',
  RingRight = 'ringRight',
  Amulet = 'amulet',
  Cloak = 'cloak',
  Relic = 'relic',
}

export type EquipmentSlotValue = `${EquipmentSlotId}`;
