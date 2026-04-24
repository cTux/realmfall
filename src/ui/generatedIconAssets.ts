import {
  parseGeneratedIconId,
  type GeneratedIconPoolKey,
} from '../game/content/generatedIconPools';
import delapouitespikedShoulderArmorIcon from '../assets/icons/generated/delapouite--spiked-shoulder-armor.svg?url&no-inline';
import lorcshoulderScalesIcon from '../assets/icons/generated/lorc--shoulder-scales.svg?url&no-inline';
import skollpauldronsIcon from '../assets/icons/generated/skoll--pauldrons.svg?url&no-inline';
import lucasmsbeltIcon from '../assets/icons/generated/lucasms--belt.svg?url&no-inline';
import delapouitebeltArmorIcon from '../assets/icons/generated/delapouite--belt-armor.svg?url&no-inline';
import delapouiteblackBeltIcon from '../assets/icons/generated/delapouite--black-belt.svg?url&no-inline';
import skollbracersIcon from '../assets/icons/generated/skoll--bracers.svg?url&no-inline';
import delapouitebracerIcon from '../assets/icons/generated/delapouite--bracer.svg?url&no-inline';
import lucasmscloakIcon from '../assets/icons/generated/lucasms--cloak.svg?url&no-inline';
import delapouitecapeIcon from '../assets/icons/generated/delapouite--cape.svg?url&no-inline';
import lorcwingCloakIcon from '../assets/icons/generated/lorc--wing-cloak.svg?url&no-inline';
import delapouitevikingHelmetIcon from '../assets/icons/generated/delapouite--viking-helmet.svg?url&no-inline';
import delapouitespartanHelmetIcon from '../assets/icons/generated/delapouite--spartan-helmet.svg?url&no-inline';
import kierHeyldwarfHelmetIcon from '../assets/icons/generated/kier-heyl--dwarf-helmet.svg?url&no-inline';
import lorccrestedHelmetIcon from '../assets/icons/generated/lorc--crested-helmet.svg?url&no-inline';
import lorcvisoredHelmIcon from '../assets/icons/generated/lorc--visored-helm.svg?url&no-inline';
import kierHeylelfHelmetIcon from '../assets/icons/generated/kier-heyl--elf-helmet.svg?url&no-inline';
import carlOlsenbrutalHelmIcon from '../assets/icons/generated/carl-olsen--brutal-helm.svg?url&no-inline';
import delapouitelightHelmIcon from '../assets/icons/generated/delapouite--light-helm.svg?url&no-inline';
import delapouiteclosedBarbuteIcon from '../assets/icons/generated/delapouite--closed-barbute.svg?url&no-inline';
import caroAsercionwarlordHelmetIcon from '../assets/icons/generated/caro-asercion--warlord-helmet.svg?url&no-inline';
import lorchornedHelmIcon from '../assets/icons/generated/lorc--horned-helm.svg?url&no-inline';
import delapouitecenturionHelmetIcon from '../assets/icons/generated/delapouite--centurion-helmet.svg?url&no-inline';
import delapouitechestArmorIcon from '../assets/icons/generated/delapouite--chest-armor.svg?url&no-inline';
import delapouiteleatherArmorIcon from '../assets/icons/generated/delapouite--leather-armor.svg?url&no-inline';
import lorcbreastplateIcon from '../assets/icons/generated/lorc--breastplate.svg?url&no-inline';
import lorclamellarIcon from '../assets/icons/generated/lorc--lamellar.svg?url&no-inline';
import delapouiteglovesIcon from '../assets/icons/generated/delapouite--gloves.svg?url&no-inline';
import lorcmailedFistIcon from '../assets/icons/generated/lorc--mailed-fist.svg?url&no-inline';
import delapouitegauntletIcon from '../assets/icons/generated/delapouite--gauntlet.svg?url&no-inline';
import delapouitemagicAxeIcon from '../assets/icons/generated/delapouite--magic-axe.svg?url&no-inline';
import delapouitesharpAxeIcon from '../assets/icons/generated/delapouite--sharp-axe.svg?url&no-inline';
import lorcbattleAxeIcon from '../assets/icons/generated/lorc--battle-axe.svg?url&no-inline';
import lorcstoneAxeIcon from '../assets/icons/generated/lorc--stone-axe.svg?url&no-inline';
import lorcfireAxeIcon from '../assets/icons/generated/lorc--fire-axe.svg?url&no-inline';
import lorcbatteredAxeIcon from '../assets/icons/generated/lorc--battered-axe.svg?url&no-inline';
import lorcwoodAxeIcon from '../assets/icons/generated/lorc--wood-axe.svg?url&no-inline';
import delapouitetomahawkIcon from '../assets/icons/generated/delapouite--tomahawk.svg?url&no-inline';
import delapouitehatchetIcon from '../assets/icons/generated/delapouite--hatchet.svg?url&no-inline';
import lorcshardSwordIcon from '../assets/icons/generated/lorc--shard-sword.svg?url&no-inline';
import lorccrocSwordIcon from '../assets/icons/generated/lorc--croc-sword.svg?url&no-inline';
import lorcbloodySwordIcon from '../assets/icons/generated/lorc--bloody-sword.svg?url&no-inline';
import lorcfragmentedSwordIcon from '../assets/icons/generated/lorc--fragmented-sword.svg?url&no-inline';
import lorcpiercingSwordIcon from '../assets/icons/generated/lorc--piercing-sword.svg?url&no-inline';
import lorcenergySwordIcon from '../assets/icons/generated/lorc--energy-sword.svg?url&no-inline';
import delapouiteglaiveIcon from '../assets/icons/generated/delapouite--glaive.svg?url&no-inline';
import lorcbroadswordIcon from '../assets/icons/generated/lorc--broadsword.svg?url&no-inline';
import lorcrelicBladeIcon from '../assets/icons/generated/lorc--relic-blade.svg?url&no-inline';
import skollgladiusIcon from '../assets/icons/generated/skoll--gladius.svg?url&no-inline';
import delapouiteboneMaceIcon from '../assets/icons/generated/delapouite--bone-mace.svg?url&no-inline';
import lorcspikedMaceIcon from '../assets/icons/generated/lorc--spiked-mace.svg?url&no-inline';
import delapouiteflangedMaceIcon from '../assets/icons/generated/delapouite--flanged-mace.svg?url&no-inline';
import lorcplainDaggerIcon from '../assets/icons/generated/lorc--plain-dagger.svg?url&no-inline';
import lorcsacrificialDaggerIcon from '../assets/icons/generated/lorc--sacrificial-dagger.svg?url&no-inline';
import lorcbroadDaggerIcon from '../assets/icons/generated/lorc--broad-dagger.svg?url&no-inline';
import delapouitelunarWandIcon from '../assets/icons/generated/delapouite--lunar-wand.svg?url&no-inline';
import lorccrystalWandIcon from '../assets/icons/generated/lorc--crystal-wand.svg?url&no-inline';
import willdabeastorbWandIcon from '../assets/icons/generated/willdabeast--orb-wand.svg?url&no-inline';
import lorcstoneSphereIcon from '../assets/icons/generated/lorc--stone-sphere.svg?url&no-inline';
import lorccrumblingBallIcon from '../assets/icons/generated/lorc--crumbling-ball.svg?url&no-inline';
import lorcfrozenOrbIcon from '../assets/icons/generated/lorc--frozen-orb.svg?url&no-inline';
import delapouitedragonOrbIcon from '../assets/icons/generated/delapouite--dragon-orb.svg?url&no-inline';
import lorcextractionOrbIcon from '../assets/icons/generated/lorc--extraction-orb.svg?url&no-inline';
import delapouiteglassBallIcon from '../assets/icons/generated/delapouite--glass-ball.svg?url&no-inline';
import delapouitetwoHandedSwordIcon from '../assets/icons/generated/delapouite--two-handed-sword.svg?url&no-inline';
import delapouitehookSwordsIcon from '../assets/icons/generated/delapouite--hook-swords.svg?url&no-inline';
import lorcdervishSwordsIcon from '../assets/icons/generated/lorc--dervish-swords.svg?url&no-inline';
import delapouiteaxeSwordIcon from '../assets/icons/generated/delapouite--axe-sword.svg?url&no-inline';
import lorccrossedAxesIcon from '../assets/icons/generated/lorc--crossed-axes.svg?url&no-inline';
import delapouitewarAxeIcon from '../assets/icons/generated/delapouite--war-axe.svg?url&no-inline';
import delapouitesharpHalberdIcon from '../assets/icons/generated/delapouite--sharp-halberd.svg?url&no-inline';
import lorchalberdIcon from '../assets/icons/generated/lorc--halberd.svg?url&no-inline';
import delapouitetoyMalletIcon from '../assets/icons/generated/delapouite--toy-mallet.svg?url&no-inline';
import willdabeastroundShieldIcon from '../assets/icons/generated/willdabeast--round-shield.svg?url&no-inline';
import delapouitegriffinShieldIcon from '../assets/icons/generated/delapouite--griffin-shield.svg?url&no-inline';
import delapouitevibratingShieldIcon from '../assets/icons/generated/delapouite--vibrating-shield.svg?url&no-inline';
import delapouitedragonShieldIcon from '../assets/icons/generated/delapouite--dragon-shield.svg?url&no-inline';
import delapouitetribalShieldIcon from '../assets/icons/generated/delapouite--tribal-shield.svg?url&no-inline';
import lorccheckedShieldIcon from '../assets/icons/generated/lorc--checked-shield.svg?url&no-inline';
import lorcfireShieldIcon from '../assets/icons/generated/lorc--fire-shield.svg?url&no-inline';
import lorcrosaShieldIcon from '../assets/icons/generated/lorc--rosa-shield.svg?url&no-inline';
import delapouitecrossShieldIcon from '../assets/icons/generated/delapouite--cross-shield.svg?url&no-inline';
import delapouitevikingShieldIcon from '../assets/icons/generated/delapouite--viking-shield.svg?url&no-inline';
import lorctrousersIcon from '../assets/icons/generated/lorc--trousers.svg?url&no-inline';
import delapouitegreavesIcon from '../assets/icons/generated/delapouite--greaves.svg?url&no-inline';
import irongamerarmoredPantsIcon from '../assets/icons/generated/irongamer--armored-pants.svg?url&no-inline';
import delapouiteskirtIcon from '../assets/icons/generated/delapouite--skirt.svg?url&no-inline';
import delapouitearmorCuissesIcon from '../assets/icons/generated/delapouite--armor-cuisses.svg?url&no-inline';
import delapouiteloinclothIcon from '../assets/icons/generated/delapouite--loincloth.svg?url&no-inline';
import delapouitelegArmorIcon from '../assets/icons/generated/delapouite--leg-armor.svg?url&no-inline';
import delapouitesandalIcon from '../assets/icons/generated/delapouite--sandal.svg?url&no-inline';
import delapouitefootPlasterIcon from '../assets/icons/generated/delapouite--foot-plaster.svg?url&no-inline';
import lorcbootsIcon from '../assets/icons/generated/lorc--boots.svg?url&no-inline';
import lorcleatherBootIcon from '../assets/icons/generated/lorc--leather-boot.svg?url&no-inline';
import lorcwalkingBootIcon from '../assets/icons/generated/lorc--walking-boot.svg?url&no-inline';
import delapouitecowboyBootIcon from '../assets/icons/generated/delapouite--cowboy-boot.svg?url&no-inline';
import darkzaitzevtabiBootIcon from '../assets/icons/generated/darkzaitzev--tabi-boot.svg?url&no-inline';
import delapouitefurBootIcon from '../assets/icons/generated/delapouite--fur-boot.svg?url&no-inline';
import lorcsteeltoeBootsIcon from '../assets/icons/generated/lorc--steeltoe-boots.svg?url&no-inline';
import delapouitemetalBootIcon from '../assets/icons/generated/delapouite--metal-boot.svg?url&no-inline';
import delapouiteringIcon from '../assets/icons/generated/delapouite--ring.svg?url&no-inline';
import delapouitepowerRingIcon from '../assets/icons/generated/delapouite--power-ring.svg?url&no-inline';
import delapouiteglobeRingIcon from '../assets/icons/generated/delapouite--globe-ring.svg?url&no-inline';
import delapouitefrozenRingIcon from '../assets/icons/generated/delapouite--frozen-ring.svg?url&no-inline';
import lorcskullRingIcon from '../assets/icons/generated/lorc--skull-ring.svg?url&no-inline';
import delapouitediamondRingIcon from '../assets/icons/generated/delapouite--diamond-ring.svg?url&no-inline';
import skollbigDiamondRingIcon from '../assets/icons/generated/skoll--big-diamond-ring.svg?url&no-inline';
import lucasmsnecklaceIcon from '../assets/icons/generated/lucasms--necklace.svg?url&no-inline';
import lorcgemNecklaceIcon from '../assets/icons/generated/lorc--gem-necklace.svg?url&no-inline';
import delapouitefeatherNecklaceIcon from '../assets/icons/generated/delapouite--feather-necklace.svg?url&no-inline';
import delapouitedoubleNecklaceIcon from '../assets/icons/generated/delapouite--double-necklace.svg?url&no-inline';
import delapouiteemeraldNecklaceIcon from '../assets/icons/generated/delapouite--emerald-necklace.svg?url&no-inline';
import delapouiteheartNecklaceIcon from '../assets/icons/generated/delapouite--heart-necklace.svg?url&no-inline';
import delapouiteprimitiveNecklaceIcon from '../assets/icons/generated/delapouite--primitive-necklace.svg?url&no-inline';
import delapouitepearlNecklaceIcon from '../assets/icons/generated/delapouite--pearl-necklace.svg?url&no-inline';
import delapouitetribalPendantIcon from '../assets/icons/generated/delapouite--tribal-pendant.svg?url&no-inline';
import lorcgemPendantIcon from '../assets/icons/generated/lorc--gem-pendant.svg?url&no-inline';

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
