const LORE_NAMES = {
  'icon-helmet': [
    'Ashwake Greathelm',
    'Valewarden Crest',
    'Ironbound Barbute',
    'Fracture Watchhelm',
    'Hollow March Helm',
    'Stormwake Crown',
    'Shardglass Visor',
    'Veinshard Casque',
    'Riftguard Sallet',
    'Voidstorm Burgonet',
    'Arken Bastion Helm',
    'Warden Embercrest',
  ],
  'icon-shoulders': [
    'Valeguard Pauldrons',
    'Shardbreaker Mantle',
    'Stormwall Shoulders',
  ],
  'icon-chest': [
    'Ironwake Cuirass',
    'Fracturebound Harness',
    'Shardwarden Hauberk',
    'Ashen Vale Brigandine',
  ],
  'icon-bracers': ['Ruinbind Bracers', 'Mana Vein Cuffs'],
  'icon-gloves': ['Forgewake Grips', 'Shardhide Gloves', 'Voidtrail Gauntlets'],
  'icon-belt': ['Riftbinder Belt', 'Stormlass Girdle', 'Valehook Sash'],
  'icon-leggings': [
    'Ironstride Leggings',
    'Ashfall Cuisses',
    'Shardroad Trousers',
    'Riftstalker Greaves',
    'Valebound Chausses',
    'Voidmarch Legwraps',
  ],
  'icon-boots': [
    'Stormstride Boots',
    'Ashwake Treads',
    'Rifttrail Sabatons',
    'Valewalker Boots',
    'Shardstep Greaves',
    'Hollow Mire Boots',
    'Fracture Climber Treads',
    'Voidglass Boots',
    'Ironroot Marchers',
    'Warden Road Sabatons',
    'Manawake Boots',
  ],
  'icon-cloak': ['Skytear Cloak', 'Valeveil Mantle', 'Voidshroud Cape'],
  'icon-axe': [
    'Ashcleaver',
    'Riftbite Axe',
    'Vale Reaper',
    'Stormrend Hatchet',
    'Shardsplitter',
    'Hollow Hew',
    'Irontribe Chopper',
    'Veinbreak Axe',
    'Duskfall Edge',
  ],
  'icon-sword': [
    'Shardwake Blade',
    'Valebrand Saber',
    'Fracture Fang',
    'Stormglass Longsword',
    'Ashen Oathblade',
    'Riftpiercer',
    'Iron Warden Sword',
    'Veinsting Blade',
    'Voidlit Falchion',
    'Skybreak Brand',
  ],
  'icon-mace': ['Hollowbreaker Mace', 'Stormmaul', 'Arken Ruinhammer'],
  'icon-dagger': ['Veinprick Knife', 'Ashfang Dagger', 'Riftwhisper Shiv'],
  'icon-wand': ['Arken Veinrod', 'Stormhush Wand', 'Vale Spark Scepter'],
  'icon-magical-sphere': [
    'Fracture Core',
    'Veinshard Orb',
    'Voidglass Sphere',
    'Stormheart Globe',
    'Arken Echo Orb',
    'Vale Ember Sphere',
  ],
  'icon-shield': [
    'Stormwall Shield',
    'Shardguard Bulwark',
    'Valebark Aegis',
    'Ironwake Bastion',
    'Ashen Wardplate',
    'Riftbrace Shield',
    'Hollowbane Guard',
    'Arken Rampart',
    'Voidstorm Pavise',
    'Veinward Kite',
  ],
  'icon-two-handed-sword': [
    'Skycleft Greatsword',
    'Stormvow Blade',
    'Riftfall Zweihander',
  ],
  'icon-two-handed-axe': [
    'Shardmaw Greataxe',
    'Voidrend Poleaxe',
    'Irontribe Fell Axe',
    'Ashstorm Halberd',
    'Warden Severance',
  ],
  'icon-two-handed-mace': ['Corebreaker Maul'],
  'icon-ring': [
    'Ring of the First Vein',
    'Shardwake Loop',
    'Valebloom Band',
    'Stormglass Circle',
    'Arken Sigil Ring',
    'Voidhush Loop',
    'Warden Oath Band',
  ],
  'icon-necklace': [
    'Pendant of Fallen Skies',
    'Valeheart Necklace',
    'Stormcall Chain',
    'Arken Rune Pendant',
    'Voidglass Necklace',
    'Shardbound Reliquary',
    'Veinwake Charm',
    'Hollow Ward Locket',
    'Riftbloom Chain',
    'Iron Warden Pendant',
  ],
} as const;

type LorePrefix = keyof typeof LORE_NAMES;

const DESCRIPTION_BY_PREFIX: Record<LorePrefix, string> = {
  'icon-helmet':
    'Raise a lore-worn helm in the image of the old shard wardens.',
  'icon-shoulders':
    'Bind layered shoulder plates fit for crossings beneath a broken sky.',
  'icon-chest':
    'Assemble a cuirass patterned after the hard-used armor of Realmfall survivors.',
  'icon-bracers':
    'Fasten practical bracers tempered for salvage, rope, and sudden steel.',
  'icon-gloves':
    'Stitch or rivet working gloves meant for ruins, frost, and hot iron.',
  'icon-belt':
    'Set a travel belt that keeps tools, charms, and spare cord close at hand.',
  'icon-leggings':
    'Cut and brace leggings built for shard roads, scree, and ruin climbs.',
  'icon-boots':
    'Finish field boots made to hold on broken stone and drifting ash.',
  'icon-cloak':
    'Drape a weather cloak meant to turn cinder wind and void-cold rain.',
  'icon-axe':
    'Forge a brutal axe in the style of the Iron Tribes and their shard wars.',
  'icon-sword':
    'Hammer out a tempered sword worthy of wardens, raiders, and ruin guards.',
  'icon-mace':
    'Shape a crushing mace for breaking bone, plate, and brittle constructs.',
  'icon-dagger':
    'Grind a narrow blade suited to close work on dark roads and ruined halls.',
  'icon-wand':
    'Bind an Mana wand after the humming instruments of the lost Arken.',
  'icon-magical-sphere':
    'Set a focused orb around refined metal and captive Mana light.',
  'icon-shield':
    'Build a shield fit to anchor the line when hollows and shardbeasts press in.',
  'icon-two-handed-sword':
    'Forge a sweeping greatblade meant to cut a path through warped ranks.',
  'icon-two-handed-axe':
    'Raise a two-handed axe heavy enough to split plate, timber, and wardstone.',
  'icon-two-handed-mace':
    'Finish a ruin-breaking maul forged for siege work and construct hunting.',
  'icon-ring':
    'Set a ring that carries a measured pulse of Mana through worked metal.',
  'icon-necklace':
    'Thread a relic necklace that steadies the heart against the Fracture.',
};

function buildLoreIndex() {
  return Object.fromEntries(
    Object.entries(LORE_NAMES).flatMap(([prefix, names]) =>
      names.map((name, index) => {
        const key = `${prefix}-${String(index + 1).padStart(2, '0')}`;
        return [
          key,
          {
            name,
            description: DESCRIPTION_BY_PREFIX[prefix as LorePrefix],
          },
        ];
      }),
    ),
  ) as Record<string, { name: string; description: string }>;
}

const LORE_BY_KEY = buildLoreIndex();

export function getGeneratedCraftingLore(key: string) {
  return LORE_BY_KEY[key];
}
