import {
  parseGeneratedIconId,
  type GeneratedIconPoolKey,
} from './generatedIconPools';
import delapouitespikedShoulderArmorIcon from '../../client/src/assets/icons/generated/delapouite--spiked-shoulder-armor.svg?url&no-inline';
import lorcshoulderScalesIcon from '../../client/src/assets/icons/generated/lorc--shoulder-scales.svg?url&no-inline';
import skollpauldronsIcon from '../../client/src/assets/icons/generated/skoll--pauldrons.svg?url&no-inline';
import lucasmsbeltIcon from '../../client/src/assets/icons/generated/lucasms--belt.svg?url&no-inline';
import delapouitebeltArmorIcon from '../../client/src/assets/icons/generated/delapouite--belt-armor.svg?url&no-inline';
import delapouiteblackBeltIcon from '../../client/src/assets/icons/generated/delapouite--black-belt.svg?url&no-inline';
import skollbracersIcon from '../../client/src/assets/icons/generated/skoll--bracers.svg?url&no-inline';
import delapouitebracerIcon from '../../client/src/assets/icons/generated/delapouite--bracer.svg?url&no-inline';
import lucasmscloakIcon from '../../client/src/assets/icons/generated/lucasms--cloak.svg?url&no-inline';
import delapouitecapeIcon from '../../client/src/assets/icons/generated/delapouite--cape.svg?url&no-inline';
import lorcwingCloakIcon from '../../client/src/assets/icons/generated/lorc--wing-cloak.svg?url&no-inline';
import delapouitevikingHelmetIcon from '../../client/src/assets/icons/generated/delapouite--viking-helmet.svg?url&no-inline';
import delapouitespartanHelmetIcon from '../../client/src/assets/icons/generated/delapouite--spartan-helmet.svg?url&no-inline';
import kierHeyldwarfHelmetIcon from '../../client/src/assets/icons/generated/kier-heyl--dwarf-helmet.svg?url&no-inline';
import lorccrestedHelmetIcon from '../../client/src/assets/icons/generated/lorc--crested-helmet.svg?url&no-inline';
import lorcvisoredHelmIcon from '../../client/src/assets/icons/generated/lorc--visored-helm.svg?url&no-inline';
import kierHeylelfHelmetIcon from '../../client/src/assets/icons/generated/kier-heyl--elf-helmet.svg?url&no-inline';
import carlOlsenbrutalHelmIcon from '../../client/src/assets/icons/generated/carl-olsen--brutal-helm.svg?url&no-inline';
import delapouitelightHelmIcon from '../../client/src/assets/icons/generated/delapouite--light-helm.svg?url&no-inline';
import delapouiteclosedBarbuteIcon from '../../client/src/assets/icons/generated/delapouite--closed-barbute.svg?url&no-inline';
import caroAsercionwarlordHelmetIcon from '../../client/src/assets/icons/generated/caro-asercion--warlord-helmet.svg?url&no-inline';
import lorchornedHelmIcon from '../../client/src/assets/icons/generated/lorc--horned-helm.svg?url&no-inline';
import delapouitecenturionHelmetIcon from '../../client/src/assets/icons/generated/delapouite--centurion-helmet.svg?url&no-inline';
import delapouitechestArmorIcon from '../../client/src/assets/icons/generated/delapouite--chest-armor.svg?url&no-inline';
import delapouiteleatherArmorIcon from '../../client/src/assets/icons/generated/delapouite--leather-armor.svg?url&no-inline';
import lorcbreastplateIcon from '../../client/src/assets/icons/generated/lorc--breastplate.svg?url&no-inline';
import lorclamellarIcon from '../../client/src/assets/icons/generated/lorc--lamellar.svg?url&no-inline';
import delapouiteglovesIcon from '../../client/src/assets/icons/generated/delapouite--gloves.svg?url&no-inline';
import lorcmailedFistIcon from '../../client/src/assets/icons/generated/lorc--mailed-fist.svg?url&no-inline';
import delapouitegauntletIcon from '../../client/src/assets/icons/generated/delapouite--gauntlet.svg?url&no-inline';
import delapouitemagicAxeIcon from '../../client/src/assets/icons/generated/delapouite--magic-axe.svg?url&no-inline';
import delapouitesharpAxeIcon from '../../client/src/assets/icons/generated/delapouite--sharp-axe.svg?url&no-inline';
import lorcbattleAxeIcon from '../../client/src/assets/icons/generated/lorc--battle-axe.svg?url&no-inline';
import lorcstoneAxeIcon from '../../client/src/assets/icons/generated/lorc--stone-axe.svg?url&no-inline';
import lorcfireAxeIcon from '../../client/src/assets/icons/generated/lorc--fire-axe.svg?url&no-inline';
import lorcbatteredAxeIcon from '../../client/src/assets/icons/generated/lorc--battered-axe.svg?url&no-inline';
import lorcwoodAxeIcon from '../../client/src/assets/icons/generated/lorc--wood-axe.svg?url&no-inline';
import delapouitetomahawkIcon from '../../client/src/assets/icons/generated/delapouite--tomahawk.svg?url&no-inline';
import delapouitehatchetIcon from '../../client/src/assets/icons/generated/delapouite--hatchet.svg?url&no-inline';
import lorcshardSwordIcon from '../../client/src/assets/icons/generated/lorc--shard-sword.svg?url&no-inline';
import lorccrocSwordIcon from '../../client/src/assets/icons/generated/lorc--croc-sword.svg?url&no-inline';
import lorcbloodySwordIcon from '../../client/src/assets/icons/generated/lorc--bloody-sword.svg?url&no-inline';
import lorcfragmentedSwordIcon from '../../client/src/assets/icons/generated/lorc--fragmented-sword.svg?url&no-inline';
import lorcpiercingSwordIcon from '../../client/src/assets/icons/generated/lorc--piercing-sword.svg?url&no-inline';
import lorcenergySwordIcon from '../../client/src/assets/icons/generated/lorc--energy-sword.svg?url&no-inline';
import delapouiteglaiveIcon from '../../client/src/assets/icons/generated/delapouite--glaive.svg?url&no-inline';
import lorcbroadswordIcon from '../../client/src/assets/icons/generated/lorc--broadsword.svg?url&no-inline';
import lorcrelicBladeIcon from '../../client/src/assets/icons/generated/lorc--relic-blade.svg?url&no-inline';
import skollgladiusIcon from '../../client/src/assets/icons/generated/skoll--gladius.svg?url&no-inline';
import delapouiteboneMaceIcon from '../../client/src/assets/icons/generated/delapouite--bone-mace.svg?url&no-inline';
import lorcspikedMaceIcon from '../../client/src/assets/icons/generated/lorc--spiked-mace.svg?url&no-inline';
import delapouiteflangedMaceIcon from '../../client/src/assets/icons/generated/delapouite--flanged-mace.svg?url&no-inline';
import lorcplainDaggerIcon from '../../client/src/assets/icons/generated/lorc--plain-dagger.svg?url&no-inline';
import lorcsacrificialDaggerIcon from '../../client/src/assets/icons/generated/lorc--sacrificial-dagger.svg?url&no-inline';
import lorcbroadDaggerIcon from '../../client/src/assets/icons/generated/lorc--broad-dagger.svg?url&no-inline';
import delapouitelunarWandIcon from '../../client/src/assets/icons/generated/delapouite--lunar-wand.svg?url&no-inline';
import lorccrystalWandIcon from '../../client/src/assets/icons/generated/lorc--crystal-wand.svg?url&no-inline';
import willdabeastorbWandIcon from '../../client/src/assets/icons/generated/willdabeast--orb-wand.svg?url&no-inline';
import lorcstoneSphereIcon from '../../client/src/assets/icons/generated/lorc--stone-sphere.svg?url&no-inline';
import lorccrumblingBallIcon from '../../client/src/assets/icons/generated/lorc--crumbling-ball.svg?url&no-inline';
import lorcfrozenOrbIcon from '../../client/src/assets/icons/generated/lorc--frozen-orb.svg?url&no-inline';
import delapouitedragonOrbIcon from '../../client/src/assets/icons/generated/delapouite--dragon-orb.svg?url&no-inline';
import lorcextractionOrbIcon from '../../client/src/assets/icons/generated/lorc--extraction-orb.svg?url&no-inline';
import delapouiteglassBallIcon from '../../client/src/assets/icons/generated/delapouite--glass-ball.svg?url&no-inline';
import delapouitetwoHandedSwordIcon from '../../client/src/assets/icons/generated/delapouite--two-handed-sword.svg?url&no-inline';
import delapouitehookSwordsIcon from '../../client/src/assets/icons/generated/delapouite--hook-swords.svg?url&no-inline';
import lorcdervishSwordsIcon from '../../client/src/assets/icons/generated/lorc--dervish-swords.svg?url&no-inline';
import delapouiteaxeSwordIcon from '../../client/src/assets/icons/generated/delapouite--axe-sword.svg?url&no-inline';
import lorccrossedAxesIcon from '../../client/src/assets/icons/generated/lorc--crossed-axes.svg?url&no-inline';
import delapouitewarAxeIcon from '../../client/src/assets/icons/generated/delapouite--war-axe.svg?url&no-inline';
import delapouitesharpHalberdIcon from '../../client/src/assets/icons/generated/delapouite--sharp-halberd.svg?url&no-inline';
import lorchalberdIcon from '../../client/src/assets/icons/generated/lorc--halberd.svg?url&no-inline';
import delapouitetoyMalletIcon from '../../client/src/assets/icons/generated/delapouite--toy-mallet.svg?url&no-inline';
import willdabeastroundShieldIcon from '../../client/src/assets/icons/generated/willdabeast--round-shield.svg?url&no-inline';
import delapouitegriffinShieldIcon from '../../client/src/assets/icons/generated/delapouite--griffin-shield.svg?url&no-inline';
import delapouitevibratingShieldIcon from '../../client/src/assets/icons/generated/delapouite--vibrating-shield.svg?url&no-inline';
import delapouitedragonShieldIcon from '../../client/src/assets/icons/generated/delapouite--dragon-shield.svg?url&no-inline';
import delapouitetribalShieldIcon from '../../client/src/assets/icons/generated/delapouite--tribal-shield.svg?url&no-inline';
import lorccheckedShieldIcon from '../../client/src/assets/icons/generated/lorc--checked-shield.svg?url&no-inline';
import lorcfireShieldIcon from '../../client/src/assets/icons/generated/lorc--fire-shield.svg?url&no-inline';
import lorcrosaShieldIcon from '../../client/src/assets/icons/generated/lorc--rosa-shield.svg?url&no-inline';
import delapouitecrossShieldIcon from '../../client/src/assets/icons/generated/delapouite--cross-shield.svg?url&no-inline';
import delapouitevikingShieldIcon from '../../client/src/assets/icons/generated/delapouite--viking-shield.svg?url&no-inline';
import lorctrousersIcon from '../../client/src/assets/icons/generated/lorc--trousers.svg?url&no-inline';
import delapouitegreavesIcon from '../../client/src/assets/icons/generated/delapouite--greaves.svg?url&no-inline';
import irongamerarmoredPantsIcon from '../../client/src/assets/icons/generated/irongamer--armored-pants.svg?url&no-inline';
import delapouiteskirtIcon from '../../client/src/assets/icons/generated/delapouite--skirt.svg?url&no-inline';
import delapouitearmorCuissesIcon from '../../client/src/assets/icons/generated/delapouite--armor-cuisses.svg?url&no-inline';
import delapouiteloinclothIcon from '../../client/src/assets/icons/generated/delapouite--loincloth.svg?url&no-inline';
import delapouitelegArmorIcon from '../../client/src/assets/icons/generated/delapouite--leg-armor.svg?url&no-inline';
import delapouitesandalIcon from '../../client/src/assets/icons/generated/delapouite--sandal.svg?url&no-inline';
import delapouitefootPlasterIcon from '../../client/src/assets/icons/generated/delapouite--foot-plaster.svg?url&no-inline';
import lorcbootsIcon from '../../client/src/assets/icons/generated/lorc--boots.svg?url&no-inline';
import lorcleatherBootIcon from '../../client/src/assets/icons/generated/lorc--leather-boot.svg?url&no-inline';
import lorcwalkingBootIcon from '../../client/src/assets/icons/generated/lorc--walking-boot.svg?url&no-inline';
import delapouitecowboyBootIcon from '../../client/src/assets/icons/generated/delapouite--cowboy-boot.svg?url&no-inline';
import darkzaitzevtabiBootIcon from '../../client/src/assets/icons/generated/darkzaitzev--tabi-boot.svg?url&no-inline';
import delapouitefurBootIcon from '../../client/src/assets/icons/generated/delapouite--fur-boot.svg?url&no-inline';
import lorcsteeltoeBootsIcon from '../../client/src/assets/icons/generated/lorc--steeltoe-boots.svg?url&no-inline';
import delapouitemetalBootIcon from '../../client/src/assets/icons/generated/delapouite--metal-boot.svg?url&no-inline';
import delapouiteringIcon from '../../client/src/assets/icons/generated/delapouite--ring.svg?url&no-inline';
import delapouitepowerRingIcon from '../../client/src/assets/icons/generated/delapouite--power-ring.svg?url&no-inline';
import delapouiteglobeRingIcon from '../../client/src/assets/icons/generated/delapouite--globe-ring.svg?url&no-inline';
import delapouitefrozenRingIcon from '../../client/src/assets/icons/generated/delapouite--frozen-ring.svg?url&no-inline';
import lorcskullRingIcon from '../../client/src/assets/icons/generated/lorc--skull-ring.svg?url&no-inline';
import delapouitediamondRingIcon from '../../client/src/assets/icons/generated/delapouite--diamond-ring.svg?url&no-inline';
import skollbigDiamondRingIcon from '../../client/src/assets/icons/generated/skoll--big-diamond-ring.svg?url&no-inline';
import lucasmsnecklaceIcon from '../../client/src/assets/icons/generated/lucasms--necklace.svg?url&no-inline';
import lorcgemNecklaceIcon from '../../client/src/assets/icons/generated/lorc--gem-necklace.svg?url&no-inline';
import delapouitefeatherNecklaceIcon from '../../client/src/assets/icons/generated/delapouite--feather-necklace.svg?url&no-inline';
import delapouitedoubleNecklaceIcon from '../../client/src/assets/icons/generated/delapouite--double-necklace.svg?url&no-inline';
import delapouiteemeraldNecklaceIcon from '../../client/src/assets/icons/generated/delapouite--emerald-necklace.svg?url&no-inline';
import delapouiteheartNecklaceIcon from '../../client/src/assets/icons/generated/delapouite--heart-necklace.svg?url&no-inline';
import delapouiteprimitiveNecklaceIcon from '../../client/src/assets/icons/generated/delapouite--primitive-necklace.svg?url&no-inline';
import delapouitepearlNecklaceIcon from '../../client/src/assets/icons/generated/delapouite--pearl-necklace.svg?url&no-inline';
import delapouitetribalPendantIcon from '../../client/src/assets/icons/generated/delapouite--tribal-pendant.svg?url&no-inline';
import lorcgemPendantIcon from '../../client/src/assets/icons/generated/lorc--gem-pendant.svg?url&no-inline';

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

export function resolveGeneratedIconAsset(icon: string) {
  const parsed = parseGeneratedIconId(icon);
  if (!parsed) return icon;

  return GENERATED_ICON_ASSET_POOLS[parsed.familyKey][parsed.index] ?? icon;
}
