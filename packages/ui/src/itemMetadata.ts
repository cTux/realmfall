type ConsumableIconFileName = string;
type ConfiguredItemTintByKey = Record<string, string>;

const CONFIGURED_ITEM_TINT_BY_KEY: ConfiguredItemTintByKey = {
  'chest-key': '#fbbf24',
  coal: '#475569',
  'cooked-fish': '#f59e0b',
  'copper-ingot': '#fb923c',
  'copper-ore': '#f59e0b',
  gold: '#fbbf24',
  'gold-ingot': '#fef08a',
  'gold-ore': '#fbbf24',
  'health-potion': '#f87171',
  'home-scroll': '#a78bfa',
  'iron-chunks': '#94a3b8',
  'iron-ingot': '#f8fafc',
  'iron-ore': '#94a3b8',
  lockpick: '#c084fc',
  'mana-potion': '#60a5fa',
  'platinum-ingot': '#f5f3ff',
  'platinum-ore': '#c084fc',
  'tin-ingot': '#f3f4f6',
  'tin-ore': '#9ca3af',
};

const TERRAFORMING_CONSUMABLE_TINTS = {
  plains: '#3f6212',
  meadow: '#4d7c0f',
  steppe: '#65a30d',
  grove: '#166534',
  forest: '#14532d',
  marsh: '#3f6212',
  rift: '#7f1d1d',
  blasted: '#7f1d1d',
  highlands: '#365314',
  mountain: '#475569',
  dunes: '#c2410c',
  badlands: '#7c2d12',
  desert: '#92400e',
  swamp: '#1f3a1f',
} as const;

export function getConfiguredItemTint(itemKey?: string | null) {
  if (!itemKey) return undefined;
  if (CONFIGURED_ITEM_TINT_BY_KEY[itemKey]) {
    return CONFIGURED_ITEM_TINT_BY_KEY[itemKey];
  }

  const terrain = itemKey.startsWith('terraforming-')
    ? itemKey.slice('terraforming-'.length)
    : '';
  return terrain
    ? TERRAFORMING_CONSUMABLE_TINTS[
        terrain as keyof typeof TERRAFORMING_CONSUMABLE_TINTS
      ]
    : undefined;
}

const ITEM_TINT_BY_ICON: Record<ConsumableIconFileName, string> = {
  'aubergine.svg': '#7c3aed',
  'beet.svg': '#b91c1c',
  'bell-pepper.svg': '#22c55e',
  'cabbage.svg': '#84cc16',
  'camp-cooking-pot.svg': '#c2410c',
  'carrot.svg': '#f97316',
  'cherry.svg': '#dc2626',
  'fried-fish.svg': '#f59e0b',
  'garlic.svg': '#f8fafc',
  'herbs-bundle.svg': '#22c55e',
  'leek.svg': '#65a30d',
  'lemon.svg': '#facc15',
  'peas.svg': '#22c55e',
  'shiny-apple.svg': '#ef4444',
  'steak.svg': '#b45309',
  'tomato.svg': '#ef4444',
};

export function getConsumableIconTint(icon: string) {
  const normalizedIcon = getIconFileName(icon);
  return ITEM_TINT_BY_ICON[normalizedIcon];
}

function getIconFileName(icon: string) {
  const clean = icon.split('?')[0]?.split('#')[0] ?? '';
  return (
    clean
      .replace(/\\/g, '/')
      .split('/')
      .filter(Boolean)
      .pop()
      ?.toLowerCase()
      .trim() ?? ''
  );
}
