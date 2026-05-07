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

export function resolveAssetUrl(relativePath: string) {
  const resolved = new URL(relativePath, import.meta.url);
  if (resolved.protocol !== 'file:') return resolved.href;

  const normalizedPath = decodeURIComponent(resolved.pathname).replace(
    /\\/g,
    '/',
  );
  const sourceMarker = '/client/src/assets/';
  if (normalizedPath.includes(sourceMarker)) {
    return `/src/assets/${normalizedPath.slice(
      normalizedPath.indexOf(sourceMarker) + sourceMarker.length,
    )}`;
  }

  const assetsMarker = '/assets/';
  const assetsMarkerIndex = normalizedPath.lastIndexOf(assetsMarker);
  if (assetsMarkerIndex >= 0) {
    return normalizedPath.slice(assetsMarkerIndex);
  }

  return normalizedPath;
}

const generatedIconAssetUrl = (relativePath: string) =>
  `${resolveAssetUrl(relativePath)}?no-inline`;

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

const delapouitespikedShoulderArmorIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--spiked-shoulder-armor.svg',
);
const lorcshoulderScalesIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--shoulder-scales.svg',
);
const skollpauldronsIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/skoll--pauldrons.svg',
);
const lucasmsbeltIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lucasms--belt.svg',
);
const delapouitebeltArmorIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--belt-armor.svg',
);
const delapouiteblackBeltIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--black-belt.svg',
);
const skollbracersIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/skoll--bracers.svg',
);
const delapouitebracerIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--bracer.svg',
);
const lucasmscloakIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lucasms--cloak.svg',
);
const delapouitecapeIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--cape.svg',
);
const lorcwingCloakIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--wing-cloak.svg',
);
const delapouitevikingHelmetIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--viking-helmet.svg',
);
const delapouitespartanHelmetIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--spartan-helmet.svg',
);
const kierHeyldwarfHelmetIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/kier-heyl--dwarf-helmet.svg',
);
const lorccrestedHelmetIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--crested-helmet.svg',
);
const lorcvisoredHelmIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--visored-helm.svg',
);
const kierHeylelfHelmetIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/kier-heyl--elf-helmet.svg',
);
const carlOlsenbrutalHelmIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/carl-olsen--brutal-helm.svg',
);
const delapouitelightHelmIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--light-helm.svg',
);
const delapouiteclosedBarbuteIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--closed-barbute.svg',
);
const caroAsercionwarlordHelmetIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/caro-asercion--warlord-helmet.svg',
);
const lorchornedHelmIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--horned-helm.svg',
);
const delapouitecenturionHelmetIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--centurion-helmet.svg',
);
const delapouitechestArmorIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--chest-armor.svg',
);
const delapouiteleatherArmorIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--leather-armor.svg',
);
const lorcbreastplateIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--breastplate.svg',
);
const lorclamellarIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--lamellar.svg',
);
const delapouiteglovesIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--gloves.svg',
);
const lorcmailedFistIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--mailed-fist.svg',
);
const delapouitegauntletIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--gauntlet.svg',
);
const delapouitemagicAxeIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--magic-axe.svg',
);
const delapouitesharpAxeIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--sharp-axe.svg',
);
const lorcbattleAxeIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--battle-axe.svg',
);
const lorcstoneAxeIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--stone-axe.svg',
);
const lorcfireAxeIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--fire-axe.svg',
);
const lorcbatteredAxeIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--battered-axe.svg',
);
const lorcwoodAxeIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--wood-axe.svg',
);
const delapouitetomahawkIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--tomahawk.svg',
);
const delapouitehatchetIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--hatchet.svg',
);
const lorcshardSwordIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--shard-sword.svg',
);
const lorccrocSwordIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--croc-sword.svg',
);
const lorcbloodySwordIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--bloody-sword.svg',
);
const lorcfragmentedSwordIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--fragmented-sword.svg',
);
const lorcpiercingSwordIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--piercing-sword.svg',
);
const lorcenergySwordIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--energy-sword.svg',
);
const delapouiteglaiveIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--glaive.svg',
);
const lorcbroadswordIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--broadsword.svg',
);
const lorcrelicBladeIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--relic-blade.svg',
);
const skollgladiusIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/skoll--gladius.svg',
);
const delapouiteboneMaceIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--bone-mace.svg',
);
const lorcspikedMaceIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--spiked-mace.svg',
);
const delapouiteflangedMaceIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--flanged-mace.svg',
);
const lorcplainDaggerIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--plain-dagger.svg',
);
const lorcsacrificialDaggerIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--sacrificial-dagger.svg',
);
const lorcbroadDaggerIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--broad-dagger.svg',
);
const delapouitelunarWandIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--lunar-wand.svg',
);
const lorccrystalWandIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--crystal-wand.svg',
);
const willdabeastorbWandIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/willdabeast--orb-wand.svg',
);
const lorcstoneSphereIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--stone-sphere.svg',
);
const lorccrumblingBallIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--crumbling-ball.svg',
);
const lorcfrozenOrbIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--frozen-orb.svg',
);
const delapouitedragonOrbIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--dragon-orb.svg',
);
const lorcextractionOrbIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--extraction-orb.svg',
);
const delapouiteglassBallIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--glass-ball.svg',
);
const delapouitetwoHandedSwordIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--two-handed-sword.svg',
);
const delapouitehookSwordsIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--hook-swords.svg',
);
const lorcdervishSwordsIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--dervish-swords.svg',
);
const delapouiteaxeSwordIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--axe-sword.svg',
);
const lorccrossedAxesIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--crossed-axes.svg',
);
const delapouitewarAxeIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--war-axe.svg',
);
const delapouitesharpHalberdIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--sharp-halberd.svg',
);
const lorchalberdIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--halberd.svg',
);
const delapouitetoyMalletIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--toy-mallet.svg',
);
const willdabeastroundShieldIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/willdabeast--round-shield.svg',
);
const delapouitegriffinShieldIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--griffin-shield.svg',
);
const delapouitevibratingShieldIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--vibrating-shield.svg',
);
const delapouitedragonShieldIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--dragon-shield.svg',
);
const delapouitetribalShieldIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--tribal-shield.svg',
);
const lorccheckedShieldIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--checked-shield.svg',
);
const lorcfireShieldIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--fire-shield.svg',
);
const lorcrosaShieldIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--rosa-shield.svg',
);
const delapouitecrossShieldIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--cross-shield.svg',
);
const delapouitevikingShieldIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--viking-shield.svg',
);
const lorctrousersIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--trousers.svg',
);
const delapouitegreavesIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--greaves.svg',
);
const irongamerarmoredPantsIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/irongamer--armored-pants.svg',
);
const delapouiteskirtIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--skirt.svg',
);
const delapouitearmorCuissesIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--armor-cuisses.svg',
);
const delapouiteloinclothIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--loincloth.svg',
);
const delapouitelegArmorIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--leg-armor.svg',
);
const delapouitesandalIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--sandal.svg',
);
const delapouitefootPlasterIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--foot-plaster.svg',
);
const lorcbootsIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--boots.svg',
);
const lorcleatherBootIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--leather-boot.svg',
);
const lorcwalkingBootIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--walking-boot.svg',
);
const delapouitecowboyBootIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--cowboy-boot.svg',
);
const darkzaitzevtabiBootIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/darkzaitzev--tabi-boot.svg',
);
const delapouitefurBootIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--fur-boot.svg',
);
const lorcsteeltoeBootsIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--steeltoe-boots.svg',
);
const delapouitemetalBootIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--metal-boot.svg',
);
const delapouiteringIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--ring.svg',
);
const delapouitepowerRingIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--power-ring.svg',
);
const delapouiteglobeRingIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--globe-ring.svg',
);
const delapouitefrozenRingIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--frozen-ring.svg',
);
const lorcskullRingIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--skull-ring.svg',
);
const delapouitediamondRingIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--diamond-ring.svg',
);
const skollbigDiamondRingIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/skoll--big-diamond-ring.svg',
);
const lucasmsnecklaceIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lucasms--necklace.svg',
);
const lorcgemNecklaceIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--gem-necklace.svg',
);
const delapouitefeatherNecklaceIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--feather-necklace.svg',
);
const delapouitedoubleNecklaceIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--double-necklace.svg',
);
const delapouiteemeraldNecklaceIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--emerald-necklace.svg',
);
const delapouiteheartNecklaceIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--heart-necklace.svg',
);
const delapouiteprimitiveNecklaceIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--primitive-necklace.svg',
);
const delapouitepearlNecklaceIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--pearl-necklace.svg',
);
const delapouitetribalPendantIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/delapouite--tribal-pendant.svg',
);
const lorcgemPendantIcon = generatedIconAssetUrl(
  '../../../client/src/assets/icons/generated/lorc--gem-pendant.svg',
);

export const GENERATED_ICON_ASSET_POOLS = {
  shoulders: [
    delapouitespikedShoulderArmorIcon,
    lorcshoulderScalesIcon,
    skollpauldronsIcon,
  ],
  belt: [lucasmsbeltIcon, delapouitebeltArmorIcon, delapouiteblackBeltIcon],
  bracers: [skollbracersIcon, delapouitebracerIcon],
  cloak: [lucasmscloakIcon, delapouitecapeIcon, lorcwingCloakIcon],
  helmet: [
    delapouitevikingHelmetIcon,
    delapouitespartanHelmetIcon,
    kierHeyldwarfHelmetIcon,
    lorccrestedHelmetIcon,
    lorcvisoredHelmIcon,
    kierHeylelfHelmetIcon,
    carlOlsenbrutalHelmIcon,
    delapouitelightHelmIcon,
    delapouiteclosedBarbuteIcon,
    caroAsercionwarlordHelmetIcon,
    lorchornedHelmIcon,
    delapouitecenturionHelmetIcon,
  ],
  chest: [
    delapouitechestArmorIcon,
    delapouiteleatherArmorIcon,
    lorcbreastplateIcon,
    lorclamellarIcon,
  ],
  gloves: [delapouiteglovesIcon, lorcmailedFistIcon, delapouitegauntletIcon],
  axe: [
    delapouitemagicAxeIcon,
    delapouitesharpAxeIcon,
    lorcbattleAxeIcon,
    lorcstoneAxeIcon,
    lorcfireAxeIcon,
    lorcbatteredAxeIcon,
    lorcwoodAxeIcon,
    delapouitetomahawkIcon,
    delapouitehatchetIcon,
  ],
  sword: [
    lorcshardSwordIcon,
    lorccrocSwordIcon,
    lorcbloodySwordIcon,
    lorcfragmentedSwordIcon,
    lorcpiercingSwordIcon,
    lorcenergySwordIcon,
    delapouiteglaiveIcon,
    lorcbroadswordIcon,
    lorcrelicBladeIcon,
    skollgladiusIcon,
  ],
  mace: [delapouiteboneMaceIcon, lorcspikedMaceIcon, delapouiteflangedMaceIcon],
  dagger: [lorcplainDaggerIcon, lorcsacrificialDaggerIcon, lorcbroadDaggerIcon],
  wand: [delapouitelunarWandIcon, lorccrystalWandIcon, willdabeastorbWandIcon],
  magicalSphere: [
    lorcstoneSphereIcon,
    lorccrumblingBallIcon,
    lorcfrozenOrbIcon,
    delapouitedragonOrbIcon,
    lorcextractionOrbIcon,
    delapouiteglassBallIcon,
  ],
  twoHandedSword: [
    delapouitetwoHandedSwordIcon,
    delapouitehookSwordsIcon,
    lorcdervishSwordsIcon,
  ],
  twoHandedAxe: [
    delapouiteaxeSwordIcon,
    lorccrossedAxesIcon,
    delapouitewarAxeIcon,
    delapouitesharpHalberdIcon,
    lorchalberdIcon,
  ],
  twoHandedMace: [delapouitetoyMalletIcon],
  shield: [
    willdabeastroundShieldIcon,
    delapouitegriffinShieldIcon,
    delapouitevibratingShieldIcon,
    delapouitedragonShieldIcon,
    delapouitetribalShieldIcon,
    lorccheckedShieldIcon,
    lorcfireShieldIcon,
    lorcrosaShieldIcon,
    delapouitecrossShieldIcon,
    delapouitevikingShieldIcon,
  ],
  leggings: [
    lorctrousersIcon,
    delapouitegreavesIcon,
    irongamerarmoredPantsIcon,
    delapouiteskirtIcon,
    delapouitearmorCuissesIcon,
    delapouiteloinclothIcon,
  ],
  feet: [
    delapouitelegArmorIcon,
    delapouitesandalIcon,
    delapouitefootPlasterIcon,
    lorcbootsIcon,
    lorcleatherBootIcon,
    lorcwalkingBootIcon,
    delapouitecowboyBootIcon,
    darkzaitzevtabiBootIcon,
    delapouitefurBootIcon,
    lorcsteeltoeBootsIcon,
    delapouitemetalBootIcon,
  ],
  ring: [
    delapouiteringIcon,
    delapouitepowerRingIcon,
    delapouiteglobeRingIcon,
    delapouitefrozenRingIcon,
    lorcskullRingIcon,
    delapouitediamondRingIcon,
    skollbigDiamondRingIcon,
  ],
  necklace: [
    lucasmsnecklaceIcon,
    lorcgemNecklaceIcon,
    delapouitefeatherNecklaceIcon,
    delapouitedoubleNecklaceIcon,
    delapouiteemeraldNecklaceIcon,
    delapouiteheartNecklaceIcon,
    delapouiteprimitiveNecklaceIcon,
    delapouitepearlNecklaceIcon,
    delapouitetribalPendantIcon,
    lorcgemPendantIcon,
  ],
} as const satisfies {
  readonly [Key in GeneratedIconPoolKey]: readonly string[];
};

export function resolveIconAsset(icon: string) {
  const parsed = parseGeneratedIconId(icon);
  if (!parsed) return icon;

  return GENERATED_ICON_ASSET_POOLS[parsed.familyKey][parsed.index] ?? icon;
}
