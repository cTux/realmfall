export const GENERATED_ICON_POOL_SIZES = {
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
} as const;

const GENERATED_ICON_ID_PREFIX = 'generated-icon:' as const;

export type GeneratedIconPoolKey = keyof typeof GENERATED_ICON_POOL_SIZES;
export type GeneratedIconId =
  `${typeof GENERATED_ICON_ID_PREFIX}${GeneratedIconPoolKey}:${number}`;

export interface ParsedGeneratedIconId {
  familyKey: GeneratedIconPoolKey;
  index: number;
}

type GeneratedIconPools = {
  readonly [Key in GeneratedIconPoolKey]: readonly GeneratedIconId[];
};

type MutableGeneratedIconPools = {
  [Key in GeneratedIconPoolKey]: GeneratedIconId[];
};

export const GENERATED_ICON_POOLS: GeneratedIconPools =
  createGeneratedIconPools();

function createGeneratedIconPools(): GeneratedIconPools {
  const pools = {} as MutableGeneratedIconPools;

  for (const familyKey of Object.keys(
    GENERATED_ICON_POOL_SIZES,
  ) as GeneratedIconPoolKey[]) {
    pools[familyKey] = Array.from(
      { length: GENERATED_ICON_POOL_SIZES[familyKey] },
      (_, index) => getGeneratedIconId(familyKey, index),
    );
  }

  return pools;
}

export function getGeneratedIconId(
  familyKey: GeneratedIconPoolKey,
  index: number,
): GeneratedIconId {
  return `${GENERATED_ICON_ID_PREFIX}${familyKey}:${index}` as GeneratedIconId;
}

export function parseGeneratedIconId(
  icon: string,
): ParsedGeneratedIconId | null {
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

export function isGeneratedIconId(icon: string): icon is GeneratedIconId {
  return parseGeneratedIconId(icon) !== null;
}

function isGeneratedIconPoolKey(
  familyKey: string,
): familyKey is GeneratedIconPoolKey {
  return Object.prototype.hasOwnProperty.call(
    GENERATED_ICON_POOL_SIZES,
    familyKey,
  );
}
