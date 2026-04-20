import { buildItemFromConfig } from './content/items';
import { Skill, type RecipeDefinition } from './types';

export const CRAFTED_EXPANSION_RECIPES: RecipeDefinition[] = [
  {
    id: 'craft-ashen-blade',
    name: 'Ashen Blade',
    description: 'Tempered blade for shard-road skirmishes.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ashen-blade', { id: 'crafted-ashen-blade' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 2 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-ashen-buckler',
    name: 'Ashen Buckler',
    description: 'Compact buckler braced against splintered steel.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ashen-buckler', {
      id: 'crafted-ashen-buckler',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'logs', name: 'Logs', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-ashen-hood',
    name: 'Ashen Hood',
    description: 'Close hood that cuts ash and glare.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ashen-hood', { id: 'crafted-ashen-hood' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-ashen-mantle',
    name: 'Ashen Mantle',
    description: 'Layered shoulders for wind and cinders.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ashen-mantle', { id: 'crafted-ashen-mantle' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-ashen-vest',
    name: 'Ashen Vest',
    description: 'Reinforced vest for labor under a broken sky.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ashen-vest', { id: 'crafted-ashen-vest' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 4 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 4 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-ashen-bracers',
    name: 'Ashen Bracers',
    description: 'Wrist guards for rope, stone, and sudden blows.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ashen-bracers', {
      id: 'crafted-ashen-bracers',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-ashen-gloves',
    name: 'Ashen Gloves',
    description: 'Work gloves stitched for salvage and cold iron.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ashen-gloves', { id: 'crafted-ashen-gloves' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-ashen-belt',
    name: 'Ashen Belt',
    description: 'Stout belt for tools, charms, and spare cord.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ashen-belt', { id: 'crafted-ashen-belt' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-ashen-leggings',
    name: 'Ashen Leggings',
    description:
      'Travel leggings for brush, rubble, and climbs.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ashen-leggings', {
      id: 'crafted-ashen-leggings',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-ashen-boots',
    name: 'Ashen Boots',
    description: 'Hard-worn boots for roads and slick ruins.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ashen-boots', { id: 'crafted-ashen-boots' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-ashen-charm',
    name: 'Ashen Charm',
    description:
      "Traveler's charm to steady the heart near Mana.",
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ashen-charm', { id: 'crafted-ashen-charm' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-ashen-cloak',
    name: 'Ashen Cloak',
    description:
      'Weather cloak for rain, soot, and drifting ash.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ashen-cloak', { id: 'crafted-ashen-cloak' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 1 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-rift-blade',
    name: 'Rift Blade',
    description: 'Tempered blade for shard-road skirmishes.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('rift-blade', { id: 'crafted-rift-blade' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 2 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-rift-buckler',
    name: 'Rift Buckler',
    description: 'Compact buckler braced against splintered steel.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('rift-buckler', { id: 'crafted-rift-buckler' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'logs', name: 'Logs', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-rift-hood',
    name: 'Rift Hood',
    description: 'Close hood that cuts ash and glare.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('rift-hood', { id: 'crafted-rift-hood' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-rift-mantle',
    name: 'Rift Mantle',
    description: 'Layered shoulders for wind and cinders.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('rift-mantle', { id: 'crafted-rift-mantle' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-rift-vest',
    name: 'Rift Vest',
    description: 'Reinforced vest for labor under a broken sky.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('rift-vest', { id: 'crafted-rift-vest' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 4 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 4 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-rift-bracers',
    name: 'Rift Bracers',
    description: 'Wrist guards for rope, stone, and sudden blows.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('rift-bracers', { id: 'crafted-rift-bracers' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-rift-gloves',
    name: 'Rift Gloves',
    description: 'Work gloves stitched for salvage and cold iron.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('rift-gloves', { id: 'crafted-rift-gloves' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-rift-belt',
    name: 'Rift Belt',
    description: 'Stout belt for tools, charms, and spare cord.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('rift-belt', { id: 'crafted-rift-belt' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-rift-leggings',
    name: 'Rift Leggings',
    description:
      'Travel leggings for brush, rubble, and climbs.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('rift-leggings', {
      id: 'crafted-rift-leggings',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-rift-boots',
    name: 'Rift Boots',
    description: 'Hard-worn boots for roads and slick ruins.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('rift-boots', { id: 'crafted-rift-boots' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-rift-charm',
    name: 'Rift Charm',
    description:
      "Traveler's charm to steady the heart near Mana.",
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('rift-charm', { id: 'crafted-rift-charm' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-rift-cloak',
    name: 'Rift Cloak',
    description:
      'Weather cloak for rain, soot, and drifting ash.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('rift-cloak', { id: 'crafted-rift-cloak' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 1 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-shard-blade',
    name: 'Shard Blade',
    description: 'Tempered blade for shard-road skirmishes.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('shard-blade', { id: 'crafted-shard-blade' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 2 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-shard-buckler',
    name: 'Shard Buckler',
    description: 'Compact buckler braced against splintered steel.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('shard-buckler', {
      id: 'crafted-shard-buckler',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'logs', name: 'Logs', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-shard-hood',
    name: 'Shard Hood',
    description: 'Close hood that cuts ash and glare.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('shard-hood', { id: 'crafted-shard-hood' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-shard-mantle',
    name: 'Shard Mantle',
    description: 'Layered shoulders for wind and cinders.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('shard-mantle', { id: 'crafted-shard-mantle' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-shard-vest',
    name: 'Shard Vest',
    description: 'Reinforced vest for labor under a broken sky.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('shard-vest', { id: 'crafted-shard-vest' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 4 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 4 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-shard-bracers',
    name: 'Shard Bracers',
    description: 'Wrist guards for rope, stone, and sudden blows.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('shard-bracers', {
      id: 'crafted-shard-bracers',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-shard-gloves',
    name: 'Shard Gloves',
    description: 'Work gloves stitched for salvage and cold iron.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('shard-gloves', { id: 'crafted-shard-gloves' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-shard-belt',
    name: 'Shard Belt',
    description: 'Stout belt for tools, charms, and spare cord.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('shard-belt', { id: 'crafted-shard-belt' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-shard-leggings',
    name: 'Shard Leggings',
    description:
      'Travel leggings for brush, rubble, and climbs.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('shard-leggings', {
      id: 'crafted-shard-leggings',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-shard-boots',
    name: 'Shard Boots',
    description: 'Hard-worn boots for roads and slick ruins.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('shard-boots', { id: 'crafted-shard-boots' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-shard-charm',
    name: 'Shard Charm',
    description:
      "Traveler's charm to steady the heart near Mana.",
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('shard-charm', { id: 'crafted-shard-charm' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-shard-cloak',
    name: 'Shard Cloak',
    description:
      'Weather cloak for rain, soot, and drifting ash.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('shard-cloak', { id: 'crafted-shard-cloak' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 1 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-vale-blade',
    name: 'Vale Blade',
    description: 'Tempered blade for shard-road skirmishes.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('vale-blade', { id: 'crafted-vale-blade' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 2 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-vale-buckler',
    name: 'Vale Buckler',
    description: 'Compact buckler braced against splintered steel.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('vale-buckler', { id: 'crafted-vale-buckler' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'logs', name: 'Logs', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-vale-hood',
    name: 'Vale Hood',
    description: 'Close hood that cuts ash and glare.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('vale-hood', { id: 'crafted-vale-hood' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-vale-mantle',
    name: 'Vale Mantle',
    description: 'Layered shoulders for wind and cinders.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('vale-mantle', { id: 'crafted-vale-mantle' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-vale-vest',
    name: 'Vale Vest',
    description: 'Reinforced vest for labor under a broken sky.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('vale-vest', { id: 'crafted-vale-vest' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 4 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 4 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-vale-bracers',
    name: 'Vale Bracers',
    description: 'Wrist guards for rope, stone, and sudden blows.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('vale-bracers', { id: 'crafted-vale-bracers' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-vale-gloves',
    name: 'Vale Gloves',
    description: 'Work gloves stitched for salvage and cold iron.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('vale-gloves', { id: 'crafted-vale-gloves' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-vale-belt',
    name: 'Vale Belt',
    description: 'Stout belt for tools, charms, and spare cord.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('vale-belt', { id: 'crafted-vale-belt' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-vale-leggings',
    name: 'Vale Leggings',
    description:
      'Travel leggings for brush, rubble, and climbs.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('vale-leggings', {
      id: 'crafted-vale-leggings',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-vale-boots',
    name: 'Vale Boots',
    description: 'Hard-worn boots for roads and slick ruins.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('vale-boots', { id: 'crafted-vale-boots' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-vale-charm',
    name: 'Vale Charm',
    description:
      "Traveler's charm to steady the heart near Mana.",
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('vale-charm', { id: 'crafted-vale-charm' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-vale-cloak',
    name: 'Vale Cloak',
    description:
      'Weather cloak for rain, soot, and drifting ash.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('vale-cloak', { id: 'crafted-vale-cloak' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 1 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-ironbound-blade',
    name: 'Ironbound Blade',
    description: 'Tempered blade for shard-road skirmishes.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ironbound-blade', {
      id: 'crafted-ironbound-blade',
    }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 2 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-ironbound-buckler',
    name: 'Ironbound Buckler',
    description: 'Compact buckler braced against splintered steel.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ironbound-buckler', {
      id: 'crafted-ironbound-buckler',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'logs', name: 'Logs', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-ironbound-hood',
    name: 'Ironbound Hood',
    description:
      'Close hood that cuts ash and glare.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ironbound-hood', {
      id: 'crafted-ironbound-hood',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-ironbound-mantle',
    name: 'Ironbound Mantle',
    description:
      'Layered shoulders for wind and cinders.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ironbound-mantle', {
      id: 'crafted-ironbound-mantle',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-ironbound-vest',
    name: 'Ironbound Vest',
    description:
      'Reinforced vest for labor under a broken sky.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ironbound-vest', {
      id: 'crafted-ironbound-vest',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 4 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 4 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-ironbound-bracers',
    name: 'Ironbound Bracers',
    description:
      'Wrist guards for rope, stone, and sudden blows.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ironbound-bracers', {
      id: 'crafted-ironbound-bracers',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-ironbound-gloves',
    name: 'Ironbound Gloves',
    description: 'Work gloves stitched for salvage and cold iron.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ironbound-gloves', {
      id: 'crafted-ironbound-gloves',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-ironbound-belt',
    name: 'Ironbound Belt',
    description:
      'Stout belt for tools, charms, and spare cord.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ironbound-belt', {
      id: 'crafted-ironbound-belt',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-ironbound-leggings',
    name: 'Ironbound Leggings',
    description:
      'Travel leggings for brush, rubble, and climbs.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ironbound-leggings', {
      id: 'crafted-ironbound-leggings',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-ironbound-boots',
    name: 'Ironbound Boots',
    description:
      'Hard-worn boots for roads and slick ruins.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ironbound-boots', {
      id: 'crafted-ironbound-boots',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-ironbound-charm',
    name: 'Ironbound Charm',
    description:
      "Traveler's charm to steady the heart near Mana.",
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ironbound-charm', {
      id: 'crafted-ironbound-charm',
    }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-ironbound-cloak',
    name: 'Ironbound Cloak',
    description:
      'Weather cloak for rain, soot, and drifting ash.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ironbound-cloak', {
      id: 'crafted-ironbound-cloak',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 1 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-storm-blade',
    name: 'Storm Blade',
    description: 'Tempered blade for shard-road skirmishes.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('storm-blade', { id: 'crafted-storm-blade' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 2 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-storm-buckler',
    name: 'Storm Buckler',
    description: 'Compact buckler braced against splintered steel.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('storm-buckler', {
      id: 'crafted-storm-buckler',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'logs', name: 'Logs', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-storm-hood',
    name: 'Storm Hood',
    description: 'Close hood that cuts ash and glare.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('storm-hood', { id: 'crafted-storm-hood' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-storm-mantle',
    name: 'Storm Mantle',
    description: 'Layered shoulders for wind and cinders.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('storm-mantle', { id: 'crafted-storm-mantle' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-storm-vest',
    name: 'Storm Vest',
    description: 'Reinforced vest for labor under a broken sky.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('storm-vest', { id: 'crafted-storm-vest' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 4 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 4 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-storm-bracers',
    name: 'Storm Bracers',
    description: 'Wrist guards for rope, stone, and sudden blows.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('storm-bracers', {
      id: 'crafted-storm-bracers',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-storm-gloves',
    name: 'Storm Gloves',
    description: 'Work gloves stitched for salvage and cold iron.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('storm-gloves', { id: 'crafted-storm-gloves' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-storm-belt',
    name: 'Storm Belt',
    description: 'Stout belt for tools, charms, and spare cord.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('storm-belt', { id: 'crafted-storm-belt' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-storm-leggings',
    name: 'Storm Leggings',
    description:
      'Travel leggings for brush, rubble, and climbs.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('storm-leggings', {
      id: 'crafted-storm-leggings',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-storm-boots',
    name: 'Storm Boots',
    description: 'Hard-worn boots for roads and slick ruins.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('storm-boots', { id: 'crafted-storm-boots' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-storm-charm',
    name: 'Storm Charm',
    description:
      "Traveler's charm to steady the heart near Mana.",
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('storm-charm', { id: 'crafted-storm-charm' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-storm-cloak',
    name: 'Storm Cloak',
    description:
      'Weather cloak for rain, soot, and drifting ash.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('storm-cloak', { id: 'crafted-storm-cloak' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 1 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-ember-blade',
    name: 'Ember Blade',
    description: 'Tempered blade for shard-road skirmishes.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ember-blade', { id: 'crafted-ember-blade' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 2 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-ember-buckler',
    name: 'Ember Buckler',
    description: 'Compact buckler braced against splintered steel.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ember-buckler', {
      id: 'crafted-ember-buckler',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'logs', name: 'Logs', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-ember-hood',
    name: 'Ember Hood',
    description: 'Close hood that cuts ash and glare.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ember-hood', { id: 'crafted-ember-hood' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-ember-mantle',
    name: 'Ember Mantle',
    description: 'Layered shoulders for wind and cinders.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ember-mantle', { id: 'crafted-ember-mantle' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-ember-vest',
    name: 'Ember Vest',
    description: 'Reinforced vest for labor under a broken sky.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ember-vest', { id: 'crafted-ember-vest' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 4 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 4 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-ember-bracers',
    name: 'Ember Bracers',
    description: 'Wrist guards for rope, stone, and sudden blows.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ember-bracers', {
      id: 'crafted-ember-bracers',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-ember-gloves',
    name: 'Ember Gloves',
    description: 'Work gloves stitched for salvage and cold iron.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ember-gloves', { id: 'crafted-ember-gloves' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-ember-belt',
    name: 'Ember Belt',
    description: 'Stout belt for tools, charms, and spare cord.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ember-belt', { id: 'crafted-ember-belt' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-ember-leggings',
    name: 'Ember Leggings',
    description:
      'Travel leggings for brush, rubble, and climbs.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ember-leggings', {
      id: 'crafted-ember-leggings',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-ember-boots',
    name: 'Ember Boots',
    description: 'Hard-worn boots for roads and slick ruins.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ember-boots', { id: 'crafted-ember-boots' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-ember-charm',
    name: 'Ember Charm',
    description:
      "Traveler's charm to steady the heart near Mana.",
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ember-charm', { id: 'crafted-ember-charm' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-ember-cloak',
    name: 'Ember Cloak',
    description:
      'Weather cloak for rain, soot, and drifting ash.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('ember-cloak', { id: 'crafted-ember-cloak' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 1 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-hollow-blade',
    name: 'Hollow Blade',
    description: 'Tempered blade for shard-road skirmishes.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('hollow-blade', { id: 'crafted-hollow-blade' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 2 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-hollow-buckler',
    name: 'Hollow Buckler',
    description: 'Compact buckler braced against splintered steel.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('hollow-buckler', {
      id: 'crafted-hollow-buckler',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'logs', name: 'Logs', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-hollow-hood',
    name: 'Hollow Hood',
    description:
      'Close hood that cuts ash and glare.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('hollow-hood', { id: 'crafted-hollow-hood' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-hollow-mantle',
    name: 'Hollow Mantle',
    description: 'Layered shoulders for wind and cinders.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('hollow-mantle', {
      id: 'crafted-hollow-mantle',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-hollow-vest',
    name: 'Hollow Vest',
    description: 'Reinforced vest for labor under a broken sky.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('hollow-vest', { id: 'crafted-hollow-vest' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 4 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 4 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-hollow-bracers',
    name: 'Hollow Bracers',
    description: 'Wrist guards for rope, stone, and sudden blows.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('hollow-bracers', {
      id: 'crafted-hollow-bracers',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-hollow-gloves',
    name: 'Hollow Gloves',
    description: 'Work gloves stitched for salvage and cold iron.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('hollow-gloves', {
      id: 'crafted-hollow-gloves',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-hollow-belt',
    name: 'Hollow Belt',
    description: 'Stout belt for tools, charms, and spare cord.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('hollow-belt', { id: 'crafted-hollow-belt' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-hollow-leggings',
    name: 'Hollow Leggings',
    description:
      'Travel leggings for brush, rubble, and climbs.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('hollow-leggings', {
      id: 'crafted-hollow-leggings',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-hollow-boots',
    name: 'Hollow Boots',
    description: 'Hard-worn boots for roads and slick ruins.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('hollow-boots', { id: 'crafted-hollow-boots' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-hollow-charm',
    name: 'Hollow Charm',
    description:
      "Traveler's charm to steady the heart near Mana.",
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('hollow-charm', { id: 'crafted-hollow-charm' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-hollow-cloak',
    name: 'Hollow Cloak',
    description:
      'Weather cloak for rain, soot, and drifting ash.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('hollow-cloak', { id: 'crafted-hollow-cloak' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 1 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-warden-blade',
    name: 'Warden Blade',
    description: 'Tempered blade for shard-road skirmishes.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('warden-blade', { id: 'crafted-warden-blade' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 2 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-warden-buckler',
    name: 'Warden Buckler',
    description: 'Compact buckler braced against splintered steel.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('warden-buckler', {
      id: 'crafted-warden-buckler',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'logs', name: 'Logs', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-warden-hood',
    name: 'Warden Hood',
    description:
      'Close hood that cuts ash and glare.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('warden-hood', { id: 'crafted-warden-hood' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-warden-mantle',
    name: 'Warden Mantle',
    description: 'Layered shoulders for wind and cinders.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('warden-mantle', {
      id: 'crafted-warden-mantle',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-warden-vest',
    name: 'Warden Vest',
    description: 'Reinforced vest for labor under a broken sky.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('warden-vest', { id: 'crafted-warden-vest' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 4 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 4 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-warden-bracers',
    name: 'Warden Bracers',
    description: 'Wrist guards for rope, stone, and sudden blows.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('warden-bracers', {
      id: 'crafted-warden-bracers',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-warden-gloves',
    name: 'Warden Gloves',
    description: 'Work gloves stitched for salvage and cold iron.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('warden-gloves', {
      id: 'crafted-warden-gloves',
    }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-warden-belt',
    name: 'Warden Belt',
    description: 'Stout belt for tools, charms, and spare cord.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('warden-belt', { id: 'crafted-warden-belt' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-warden-leggings',
    name: 'Warden Leggings',
    description:
      'Travel leggings for brush, rubble, and climbs.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('warden-leggings', {
      id: 'crafted-warden-leggings',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-warden-boots',
    name: 'Warden Boots',
    description: 'Hard-worn boots for roads and slick ruins.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('warden-boots', { id: 'crafted-warden-boots' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-warden-charm',
    name: 'Warden Charm',
    description:
      "Traveler's charm to steady the heart near Mana.",
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('warden-charm', { id: 'crafted-warden-charm' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-warden-cloak',
    name: 'Warden Cloak',
    description:
      'Weather cloak for rain, soot, and drifting ash.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('warden-cloak', { id: 'crafted-warden-cloak' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 1 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-void-blade',
    name: 'Void Blade',
    description: 'Tempered blade for shard-road skirmishes.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('void-blade', { id: 'crafted-void-blade' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 2 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-void-buckler',
    name: 'Void Buckler',
    description: 'Compact buckler braced against splintered steel.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('void-buckler', { id: 'crafted-void-buckler' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'logs', name: 'Logs', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-void-hood',
    name: 'Void Hood',
    description: 'Close hood that cuts ash and glare.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('void-hood', { id: 'crafted-void-hood' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-void-mantle',
    name: 'Void Mantle',
    description: 'Layered shoulders for wind and cinders.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('void-mantle', { id: 'crafted-void-mantle' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-void-vest',
    name: 'Void Vest',
    description: 'Reinforced vest for labor under a broken sky.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('void-vest', { id: 'crafted-void-vest' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 4 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 4 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-void-bracers',
    name: 'Void Bracers',
    description: 'Wrist guards for rope, stone, and sudden blows.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('void-bracers', { id: 'crafted-void-bracers' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-void-gloves',
    name: 'Void Gloves',
    description: 'Work gloves stitched for salvage and cold iron.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('void-gloves', { id: 'crafted-void-gloves' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-void-belt',
    name: 'Void Belt',
    description: 'Stout belt for tools, charms, and spare cord.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('void-belt', { id: 'crafted-void-belt' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-void-leggings',
    name: 'Void Leggings',
    description:
      'Travel leggings for brush, rubble, and climbs.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('void-leggings', {
      id: 'crafted-void-leggings',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-void-boots',
    name: 'Void Boots',
    description: 'Hard-worn boots for roads and slick ruins.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('void-boots', { id: 'crafted-void-boots' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-void-charm',
    name: 'Void Charm',
    description:
      "Traveler's charm to steady the heart near Mana.",
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('void-charm', { id: 'crafted-void-charm' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-void-cloak',
    name: 'Void Cloak',
    description:
      'Weather cloak for rain, soot, and drifting ash.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('void-cloak', { id: 'crafted-void-cloak' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 1 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-dawn-blade',
    name: 'Dawn Blade',
    description: 'Tempered blade for shard-road skirmishes.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dawn-blade', { id: 'crafted-dawn-blade' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 2 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-dawn-buckler',
    name: 'Dawn Buckler',
    description: 'Compact buckler braced against splintered steel.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dawn-buckler', { id: 'crafted-dawn-buckler' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'logs', name: 'Logs', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-dawn-hood',
    name: 'Dawn Hood',
    description: 'Close hood that cuts ash and glare.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dawn-hood', { id: 'crafted-dawn-hood' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-dawn-mantle',
    name: 'Dawn Mantle',
    description: 'Layered shoulders for wind and cinders.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dawn-mantle', { id: 'crafted-dawn-mantle' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-dawn-vest',
    name: 'Dawn Vest',
    description: 'Reinforced vest for labor under a broken sky.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dawn-vest', { id: 'crafted-dawn-vest' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 4 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 4 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-dawn-bracers',
    name: 'Dawn Bracers',
    description: 'Wrist guards for rope, stone, and sudden blows.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dawn-bracers', { id: 'crafted-dawn-bracers' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-dawn-gloves',
    name: 'Dawn Gloves',
    description: 'Work gloves stitched for salvage and cold iron.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dawn-gloves', { id: 'crafted-dawn-gloves' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-dawn-belt',
    name: 'Dawn Belt',
    description: 'Stout belt for tools, charms, and spare cord.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dawn-belt', { id: 'crafted-dawn-belt' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-dawn-leggings',
    name: 'Dawn Leggings',
    description:
      'Travel leggings for brush, rubble, and climbs.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dawn-leggings', {
      id: 'crafted-dawn-leggings',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-dawn-boots',
    name: 'Dawn Boots',
    description: 'Hard-worn boots for roads and slick ruins.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dawn-boots', { id: 'crafted-dawn-boots' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-dawn-charm',
    name: 'Dawn Charm',
    description:
      "Traveler's charm to steady the heart near Mana.",
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dawn-charm', { id: 'crafted-dawn-charm' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-dawn-cloak',
    name: 'Dawn Cloak',
    description:
      'Weather cloak for rain, soot, and drifting ash.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dawn-cloak', { id: 'crafted-dawn-cloak' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 1 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-dusk-blade',
    name: 'Dusk Blade',
    description: 'Tempered blade for shard-road skirmishes.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dusk-blade', { id: 'crafted-dusk-blade' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 2 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-dusk-buckler',
    name: 'Dusk Buckler',
    description: 'Compact buckler braced against splintered steel.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dusk-buckler', { id: 'crafted-dusk-buckler' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'logs', name: 'Logs', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-dusk-hood',
    name: 'Dusk Hood',
    description: 'Close hood that cuts ash and glare.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dusk-hood', { id: 'crafted-dusk-hood' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-dusk-mantle',
    name: 'Dusk Mantle',
    description: 'Layered shoulders for wind and cinders.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dusk-mantle', { id: 'crafted-dusk-mantle' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-dusk-vest',
    name: 'Dusk Vest',
    description: 'Reinforced vest for labor under a broken sky.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dusk-vest', { id: 'crafted-dusk-vest' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 4 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 4 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-dusk-bracers',
    name: 'Dusk Bracers',
    description: 'Wrist guards for rope, stone, and sudden blows.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dusk-bracers', { id: 'crafted-dusk-bracers' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-dusk-gloves',
    name: 'Dusk Gloves',
    description: 'Work gloves stitched for salvage and cold iron.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dusk-gloves', { id: 'crafted-dusk-gloves' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-dusk-belt',
    name: 'Dusk Belt',
    description: 'Stout belt for tools, charms, and spare cord.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dusk-belt', { id: 'crafted-dusk-belt' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-dusk-leggings',
    name: 'Dusk Leggings',
    description:
      'Travel leggings for brush, rubble, and climbs.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dusk-leggings', {
      id: 'crafted-dusk-leggings',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-dusk-boots',
    name: 'Dusk Boots',
    description: 'Hard-worn boots for roads and slick ruins.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dusk-boots', { id: 'crafted-dusk-boots' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-dusk-charm',
    name: 'Dusk Charm',
    description:
      "Traveler's charm to steady the heart near Mana.",
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dusk-charm', { id: 'crafted-dusk-charm' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-dusk-cloak',
    name: 'Dusk Cloak',
    description:
      'Weather cloak for rain, soot, and drifting ash.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('dusk-cloak', { id: 'crafted-dusk-cloak' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 1 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-moss-blade',
    name: 'Moss Blade',
    description: 'Tempered blade for shard-road skirmishes.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('moss-blade', { id: 'crafted-moss-blade' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 2 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-moss-buckler',
    name: 'Moss Buckler',
    description: 'Compact buckler braced against splintered steel.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('moss-buckler', { id: 'crafted-moss-buckler' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'logs', name: 'Logs', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-moss-hood',
    name: 'Moss Hood',
    description: 'Close hood that cuts ash and glare.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('moss-hood', { id: 'crafted-moss-hood' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
  {
    id: 'craft-moss-mantle',
    name: 'Moss Mantle',
    description: 'Layered shoulders for wind and cinders.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('moss-mantle', { id: 'crafted-moss-mantle' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-moss-vest',
    name: 'Moss Vest',
    description: 'Reinforced vest for labor under a broken sky.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('moss-vest', { id: 'crafted-moss-vest' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 4 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 4 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-moss-bracers',
    name: 'Moss Bracers',
    description: 'Wrist guards for rope, stone, and sudden blows.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('moss-bracers', { id: 'crafted-moss-bracers' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
    ],
  },
  {
    id: 'craft-moss-gloves',
    name: 'Moss Gloves',
    description: 'Work gloves stitched for salvage and cold iron.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('moss-gloves', { id: 'crafted-moss-gloves' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-moss-belt',
    name: 'Moss Belt',
    description: 'Stout belt for tools, charms, and spare cord.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('moss-belt', { id: 'crafted-moss-belt' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-moss-leggings',
    name: 'Moss Leggings',
    description:
      'Travel leggings for brush, rubble, and climbs.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('moss-leggings', {
      id: 'crafted-moss-leggings',
    }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-moss-boots',
    name: 'Moss Boots',
    description: 'Hard-worn boots for roads and slick ruins.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('moss-boots', { id: 'crafted-moss-boots' }),
    ingredients: [
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 3 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-moss-charm',
    name: 'Moss Charm',
    description:
      "Traveler's charm to steady the heart near Mana.",
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('moss-charm', { id: 'crafted-moss-charm' }),
    ingredients: [
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 1 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 2 },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-moss-cloak',
    name: 'Moss Cloak',
    description:
      'Weather cloak for rain, soot, and drifting ash.',
    skill: Skill.Crafting as const,
    output: buildItemFromConfig('moss-cloak', { id: 'crafted-moss-cloak' }),
    ingredients: [
      { itemKey: 'cloth', name: 'Cloth', quantity: 3 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 1 },
      { itemKey: 'leather-scraps', name: 'Leather Scraps', quantity: 1 },
    ],
  },
];

