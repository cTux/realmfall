import { ABILITY_ICON_IDS } from '@realmfall/core/game/content/iconIds';
import {
  CONTENT_ICON_IDS,
  STATUS_EFFECT_ICON_IDS,
  type GameplayIconId,
} from '@realmfall/core/game/content/iconIds';
import playerIcon from '../assets/icons/visored-helm.svg';
import enemyIcon from '../assets/icons/wolf-head.svg';
import weaponIcon from '../assets/icons/plain-dagger.svg';
import armorIcon from '../assets/icons/checked-shield.svg';
import artifactIcon from '../assets/icons/ankh.svg';
import consumableIcon from '../assets/icons/potion-ball.svg';
import magicPotionIcon from '../assets/icons/magic-potion.svg';
import marauderIcon from '../assets/icons/marauder.svg';
import hoodIcon from '../assets/icons/hood.svg';
import mailedFistIcon from '../assets/icons/mailed-fist.svg';
import steeltoeBootsIcon from '../assets/icons/steeltoe-boots.svg';
import crystalBallIcon from '../assets/icons/crystal-ball.svg';
import hornedHelmIcon from '../assets/icons/horned-helm.svg';
import spikedArmorIcon from '../assets/icons/spiked-armor.svg';
import villageIcon from '../assets/icons/village.svg';
import dungeonGateIcon from '../assets/icons/dungeon-gate.svg';
import anvilIcon from '../assets/icons/anvil.svg';
import animalHideIcon from '../assets/icons/animal-hide.svg';
import boarIcon from '../assets/icons/boar.svg';
import stonePileIcon from '../assets/icons/stone-pile.svg';
import axeInStumpIcon from '../assets/icons/axe-in-stump.svg';
const coinsIcon = `${import.meta.env.BASE_URL}assets/icons/coins.svg`;
import herbsBundleIcon from '../assets/icons/herbs-bundle.svg';
import beetIcon from '../assets/icons/beet.svg';
import bellPepperIcon from '../assets/icons/bell-pepper.svg';
import cabbageIcon from '../assets/icons/cabbage.svg';
import carrotIcon from '../assets/icons/carrot.svg';
import cherryIcon from '../assets/icons/cherry.svg';
import garlicIcon from '../assets/icons/garlic.svg';
import leekIcon from '../assets/icons/leek.svg';
import lemonIcon from '../assets/icons/lemon.svg';
import logIcon from '../assets/icons/log.svg';
import oreIcon from '../assets/icons/ore.svg';
import goldBarIcon from '../assets/icons/gold-bar.svg';
import peasIcon from '../assets/icons/peas.svg';
import salmonIcon from '../assets/icons/salmon.svg';
import shinyAppleIcon from '../assets/icons/shiny-apple.svg';
import sparklesIcon from '../assets/icons/sparkles.svg';
import stagIcon from '../assets/icons/stag.svg';
import steakIcon from '../assets/icons/steak.svg';
import stoneBlockIcon from '../assets/icons/stone-block.svg';
import spillIcon from '../assets/icons/spill.svg';
import sunCloudIcon from '../assets/icons/sun-cloud.svg';
import rainingIcon from '../assets/icons/raining.svg';
import snowingIcon from '../assets/icons/snowing.svg';
import highGrassIcon from '../assets/icons/high-grass.svg';
import tomatoIcon from '../assets/icons/tomato.svg';
import totemIcon from '../assets/icons/totem.svg';
import woodStickIcon from '../assets/icons/wood-stick.svg';
import bookCoverIcon from '../assets/icons/book-cover.svg';
import friedFishIcon from '../assets/icons/fried-fish.svg';
import campCookingPotIcon from '../assets/icons/camp-cooking-pot.svg';
import stoneCraftingIcon from '../assets/icons/stone-crafting.svg';
import aubergineIcon from '../assets/icons/aubergine.svg';
import spiderAltIcon from '../assets/icons/spider-alt.svg';
import tiedScrollIcon from '../assets/icons/tied-scroll.svg';
import rolledClothIcon from '../assets/icons/rolled-cloth.svg';
import raiderIcon from '../assets/icons/raider.svg';
import gluttonyIcon from '../assets/icons/gluttony.svg';
import furnaceIcon from '../assets/icons/furnace.svg';
import flaxIcon from '../assets/game-icons/delapouite/flax.svg';
import goblinHeadIcon from '../assets/game-icons/delapouite/goblin-head.svg';
import lockpicksIcon from '../assets/game-icons/delapouite/lockpicks.svg';
import sewingStringIcon from '../assets/game-icons/delapouite/sewing-string.svg';
import earthCrackIcon from '../assets/game-icons/lorc/earth-crack.svg';
import lockedChestIcon from '../assets/game-icons/lorc/locked-chest.svg';
import chestKeyIcon from '../assets/game-icons/sbed/key.svg';
import heartPlusIcon from '../assets/game-icons/zeromancer/heart-plus.svg';
import heartMinusIcon from '../assets/game-icons/zeromancer/heart-minus.svg';
import swordSliceIcon from '../assets/game-icons/lorc/sword-slice.svg';
import swordClashIcon from '../assets/game-icons/lorc/sword-clash.svg';
import thrownSpearIcon from '../assets/game-icons/lorc/thrown-spear.svg';
import smashingArrowsIcon from '../assets/game-icons/lorc/smash-arrows.svg';
import whirlwindIcon from '../assets/game-icons/lorc/whirlwind.svg';
import fireballIcon from '../assets/game-icons/lorc/fireball.svg';
import fireWaveIcon from '../assets/game-icons/lorc/fire-wave.svg';
import fireRingIcon from '../assets/game-icons/lorc/fire-ring.svg';
import fireRayIcon from '../assets/game-icons/lorc/fire-ray.svg';
import threeBurningBallsIcon from '../assets/game-icons/lorc/three-burning-balls.svg';
import wildfiresIcon from '../assets/game-icons/lorc/wildfires.svg';
import chainLightningIcon from '../assets/game-icons/willdabeast/chain-lightning.svg';
import thunderballIcon from '../assets/game-icons/lorc/thunderball.svg';
import thunderStruckIcon from '../assets/game-icons/lorc/thunder-struck.svg';
import lightningStormIcon from '../assets/game-icons/lorc/lightning-storm.svg';
import lightningArcIcon from '../assets/game-icons/lorc/lightning-arc.svg';
import staticWavesIcon from '../assets/game-icons/lorc/static-waves.svg';
import iceBoltIcon from '../assets/game-icons/lorc/ice-bolt.svg';
import iceSpearIcon from '../assets/game-icons/lorc/ice-spear.svg';
import icebergsIcon from '../assets/game-icons/lorc/icebergs.svg';
import personInBlizzardIcon from '../assets/game-icons/lorc/person-in-blizzard.svg';
import snowflakeIcon from '../assets/game-icons/lorc/snowflake-2.svg';
import brainFreezeIcon from '../assets/game-icons/lorc/brain-freeze.svg';
import healingIcon from '../assets/game-icons/delapouite/healing.svg';
import healthPotionIcon from '../assets/game-icons/delapouite/health-potion.svg';
import knightBannerIcon from '../assets/game-icons/delapouite/knight-banner.svg';
import verticalBannerIcon from '../assets/game-icons/delapouite/vertical-banner.svg';
import shieldIcon from '../assets/game-icons/sbed/shield.svg';
import magicShieldIcon from '../assets/game-icons/lorc/magic-shield.svg';
import battlePrayerIcon from '../assets/game-icons/delapouite/sparkles.svg';
import recentDeathIcon from '../assets/icons/recent-death.svg';
import restorationIcon from '../assets/icons/restoration.svg';
import mouthWateringIcon from '../assets/icons/mouth-watering.svg';
import waterskinIcon from '../assets/icons/waterskin.svg';
import bleedingIcon from '../assets/icons/status-bleeding.svg';
import poisonIcon from '../assets/icons/status-poison.svg';
import burningIcon from '../assets/icons/status-burning.svg';
import chillingIcon from '../assets/icons/status-chilling.svg';
import powerIcon from '../assets/icons/status-power.svg';
import frenzyIcon from '../assets/icons/status-frenzy.svg';
import guardIcon from '../assets/game-icons/sbed/shield.svg';
import weakenedIcon from '../assets/game-icons/zeromancer/heart-minus.svg';
import shockedIcon from '../assets/game-icons/lorc/static.svg';

const CONTENT_ICON_ASSETS_BY_KEY = {
  Player: playerIcon,
  Enemy: enemyIcon,
  Weapon: weaponIcon,
  Armor: armorIcon,
  Artifact: artifactIcon,
  Consumable: consumableIcon,
  MagicPotion: magicPotionIcon,
  Marauder: marauderIcon,
  Hood: hoodIcon,
  Gauntlet: mailedFistIcon,
  Boots: steeltoeBootsIcon,
  Orb: crystalBallIcon,
  HornedHelm: hornedHelmIcon,
  Chest: spikedArmorIcon,
  Village: villageIcon,
  DungeonGate: dungeonGateIcon,
  Anvil: anvilIcon,
  AnimalHide: animalHideIcon,
  Boar: boarIcon,
  StonePile: stonePileIcon,
  AxeInStump: axeInStumpIcon,
  Coins: coinsIcon,
  HerbsBundle: herbsBundleIcon,
  Beet: beetIcon,
  BellPepper: bellPepperIcon,
  Cabbage: cabbageIcon,
  Carrot: carrotIcon,
  Cherry: cherryIcon,
  Garlic: garlicIcon,
  Leek: leekIcon,
  Lemon: lemonIcon,
  Log: logIcon,
  Ore: oreIcon,
  GoldBar: goldBarIcon,
  Peas: peasIcon,
  Salmon: salmonIcon,
  ShinyApple: shinyAppleIcon,
  Sparkles: sparklesIcon,
  Stag: stagIcon,
  Steak: steakIcon,
  StoneBlock: stoneBlockIcon,
  Spill: spillIcon,
  SunCloud: sunCloudIcon,
  Raining: rainingIcon,
  Snowing: snowingIcon,
  HighGrass: highGrassIcon,
  Flax: flaxIcon,
  Tomato: tomatoIcon,
  Totem: totemIcon,
  WoodStick: woodStickIcon,
  BookCover: bookCoverIcon,
  FriedFish: friedFishIcon,
  CampCookingPot: campCookingPotIcon,
  StoneCrafting: stoneCraftingIcon,
  Aubergine: aubergineIcon,
  Spider: spiderAltIcon,
  TiedScroll: tiedScrollIcon,
  RolledCloth: rolledClothIcon,
  Raider: raiderIcon,
  Gluttony: gluttonyIcon,
  Furnace: furnaceIcon,
  SewingString: sewingStringIcon,
  TreasureGoblin: goblinHeadIcon,
  Lockpicks: lockpicksIcon,
  LockedChest: lockedChestIcon,
  ChestKey: chestKeyIcon,
  EarthCrack: earthCrackIcon,
} as const satisfies Record<keyof typeof CONTENT_ICON_IDS, string>;

const ABILITY_ICON_ASSETS_BY_KEY = {
  kick: smashingArrowsIcon,
  slash: swordSliceIcon,
  crushingBlow: swordClashIcon,
  hamstring: thrownSpearIcon,
  whirlwind: whirlwindIcon,
  impale: fireRayIcon,
  emberShot: fireRayIcon,
  fireball: fireballIcon,
  searingNova: fireRingIcon,
  cinderBurst: threeBurningBallsIcon,
  magmaStrike: fireWaveIcon,
  wildfire: wildfiresIcon,
  sparkJolt: lightningArcIcon,
  arcBolt: thunderballIcon,
  thunderClap: thunderStruckIcon,
  chainLightning: chainLightningIcon,
  stormSurge: lightningStormIcon,
  staticField: staticWavesIcon,
  frostShard: iceBoltIcon,
  iceLance: iceSpearIcon,
  freezingWave: icebergsIcon,
  coldSnap: snowflakeIcon,
  blizzard: personInBlizzardIcon,
  brainFreeze: brainFreezeIcon,
  mendWounds: heartPlusIcon,
  fieldDressing: healthPotionIcon,
  soothingMist: healingIcon,
  rallyingCry: knightBannerIcon,
  battlePrayer: battlePrayerIcon,
  warBanner: verticalBannerIcon,
  ironGuard: shieldIcon,
  arcWard: magicShieldIcon,
  witheringHex: heartMinusIcon,
  sunderArmor: heartMinusIcon,
  enfeeblingPulse: heartMinusIcon,
} as const satisfies Record<keyof typeof ABILITY_ICON_IDS, string>;

const STATUS_EFFECT_ICON_ASSETS_BY_KEY = {
  hunger: mouthWateringIcon,
  thirst: waterskinIcon,
  recentDeath: recentDeathIcon,
  restoration: restorationIcon,
  bleeding: bleedingIcon,
  poison: poisonIcon,
  burning: burningIcon,
  chilling: chillingIcon,
  power: powerIcon,
  frenzy: frenzyIcon,
  guard: guardIcon,
  weakened: weakenedIcon,
  shocked: shockedIcon,
} as const satisfies Record<keyof typeof STATUS_EFFECT_ICON_IDS, string>;

const CONTENT_ICON_ASSET_IDS = mapIconAssetsById(
  CONTENT_ICON_IDS,
  CONTENT_ICON_ASSETS_BY_KEY,
);
const ABILITY_ICON_ASSET_IDS = mapIconAssetsById(
  ABILITY_ICON_IDS,
  ABILITY_ICON_ASSETS_BY_KEY,
);
const STATUS_EFFECT_ICON_ASSET_IDS = mapIconAssetsById(
  STATUS_EFFECT_ICON_IDS,
  STATUS_EFFECT_ICON_ASSETS_BY_KEY,
);

export const GAMEPLAY_ICON_ASSET_IDS: Record<GameplayIconId, string> = {
  ...CONTENT_ICON_ASSET_IDS,
  ...ABILITY_ICON_ASSET_IDS,
  ...STATUS_EFFECT_ICON_ASSET_IDS,
};

export function resolveGameplayIconAsset(icon: string): string | undefined {
  return GAMEPLAY_ICON_ASSET_IDS[icon as GameplayIconId];
}

function mapIconAssetsById<IconIdsByKey extends Record<string, string>>(
  iconIds: IconIdsByKey,
  iconAssetByKey: Record<keyof IconIdsByKey & string, string>,
) {
  const entries = Object.entries(iconIds) as Array<
    [keyof IconIdsByKey & string, IconIdsByKey[keyof IconIdsByKey]]
  >;
  const iconAssetsById = {} as Record<IconIdsByKey[keyof IconIdsByKey], string>;
  for (const [iconKey, iconId] of entries) {
    iconAssetsById[iconId] = iconAssetByKey[iconKey];
  }
  return iconAssetsById;
}
