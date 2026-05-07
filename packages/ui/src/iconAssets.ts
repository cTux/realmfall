import { GENERATED_ICON_ASSET_POOLS } from './bridges/generatedIconAssets';

const GENERATED_ICON_ID_PREFIX = 'generated-icon:' as const;

type GeneratedIconPoolKey =
  | 'shoulders'
  | 'belt'
  | 'bracers'
  | 'cloak'
  | 'helmet'
  | 'chest'
  | 'gloves'
  | 'axe'
  | 'sword'
  | 'mace'
  | 'dagger'
  | 'wand'
  | 'magicalSphere'
  | 'twoHandedSword'
  | 'twoHandedAxe'
  | 'twoHandedMace'
  | 'shield'
  | 'leggings'
  | 'feet'
  | 'ring'
  | 'necklace';

interface ParsedGeneratedIconId {
  familyKey: GeneratedIconPoolKey;
  index: number;
}

const GENERATED_ICON_POOL_SIZES: Record<GeneratedIconPoolKey, number> = {
  shoulders: 3,
  belt: 3,
  bracers: 2,
  cloak: 3,
  helmet: 12,
  chest: 4,
  gloves: 3,
  axe: 9,
  sword: 10,
  mace: 3,
  dagger: 3,
  wand: 3,
  magicalSphere: 6,
  twoHandedSword: 3,
  twoHandedAxe: 5,
  twoHandedMace: 1,
  shield: 10,
  leggings: 6,
  feet: 11,
  ring: 7,
  necklace: 10,
};

function isGeneratedIconPoolKey(
  familyKey: string,
): familyKey is GeneratedIconPoolKey {
  return Object.prototype.hasOwnProperty.call(
    GENERATED_ICON_POOL_SIZES,
    familyKey,
  );
}

function parseGeneratedIconId(icon: string): ParsedGeneratedIconId | null {
  if (!icon.startsWith(GENERATED_ICON_ID_PREFIX)) return null;

  const id = icon.slice(GENERATED_ICON_ID_PREFIX.length);
  const separatorIndex = id.lastIndexOf(':');
  if (separatorIndex <= 0) return null;

  const familyKey = id.slice(0, separatorIndex);
  if (!isGeneratedIconPoolKey(familyKey)) return null;

  const index = Number(id.slice(separatorIndex + 1));
  if (!Number.isInteger(index) || index < 0) return null;

  return index < GENERATED_ICON_POOL_SIZES[familyKey]
    ? { familyKey, index }
    : null;
}

export { GENERATED_ICON_ASSET_POOLS };

export function resolveIconAsset(icon: string) {
  const parsed = parseGeneratedIconId(icon);
  if (!parsed) return icon;

  return GENERATED_ICON_ASSET_POOLS[parsed.familyKey][parsed.index] ?? icon;
}
