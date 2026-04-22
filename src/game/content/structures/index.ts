import type {
  GatheringStructureType,
  StructureType,
  Terrain,
} from '../../types';
import {
  itemName,
  structureActionLabel as localizedStructureActionLabel,
  structureDepletedText,
  structureDescription,
  structureGatherVerb,
  structureTitle,
} from '../i18n';
import type { StructureConfig } from '../types';
import { GAME_TAGS, getSkillTags, uniqueTags } from '../tags';
import { campStructureConfig } from './camp';
import { coalOreStructureConfig } from './coalOre';
import { corruptionAltarStructureConfig } from './corruptionAltar';
import { copperOreStructureConfig } from './copperOre';
import { dungeonStructureConfig } from './dungeon';
import { forgeStructureConfig } from './forge';
import { furnaceStructureConfig } from './furnace';
import { goldOreStructureConfig } from './goldOre';
import { herbsStructureConfig } from './herbs';
import { ironOreStructureConfig } from './ironOre';
import { lakeStructureConfig } from './lake';
import { manaFontStructureConfig } from './manaFont';
import { platinumOreStructureConfig } from './platinumOre';
import { pondStructureConfig } from './pond';
import { runeForgeStructureConfig } from './runeForge';
import { tinOreStructureConfig } from './tinOre';
import { townStructureConfig } from './town';
import { treeStructureConfig } from './tree';
import { workshopStructureConfig } from './workshop';

const RAW_STRUCTURE_CONFIGS = [
  dungeonStructureConfig,
  corruptionAltarStructureConfig,
  forgeStructureConfig,
  runeForgeStructureConfig,
  townStructureConfig,
  manaFontStructureConfig,
  furnaceStructureConfig,
  workshopStructureConfig,
  campStructureConfig,
  herbsStructureConfig,
  treeStructureConfig,
  tinOreStructureConfig,
  goldOreStructureConfig,
  platinumOreStructureConfig,
  copperOreStructureConfig,
  ironOreStructureConfig,
  coalOreStructureConfig,
  pondStructureConfig,
  lakeStructureConfig,
] as const;

export const STRUCTURE_CONFIGS: StructureConfig[] = RAW_STRUCTURE_CONFIGS.map(
  (config) => ({
    ...config,
    tags: buildStructureTags(config),
    title: structureTitle(config.type),
    description: structureDescription(config.type),
    gathering: config.gathering
      ? {
          ...config.gathering,
          actionLabel: localizedStructureActionLabel(config.type),
          reward: itemName(config.gathering.rewardItemKey),
          verb: structureGatherVerb(config.type),
          depletedText: structureDepletedText(config.type),
        }
      : undefined,
  }),
);

const STRUCTURE_CONFIG_BY_TYPE = Object.fromEntries(
  STRUCTURE_CONFIGS.map((config) => [config.type, config]),
);

const GATHERING_STRUCTURE_TYPES = STRUCTURE_CONFIGS.filter((config) =>
  Boolean(config.gathering),
).map((config) => config.type as GatheringStructureType);

export function getStructureConfig(structure: StructureType) {
  return STRUCTURE_CONFIG_BY_TYPE[structure];
}

export function getGatheringStructureConfig(structure: GatheringStructureType) {
  const config = STRUCTURE_CONFIG_BY_TYPE[structure];
  if (!config?.gathering) {
    throw new Error(`Missing gathering config for structure: ${structure}`);
  }
  return config as StructureConfig & {
    type: GatheringStructureType;
    gathering: NonNullable<StructureConfig['gathering']>;
  };
}

export function isGatheringStructureType(
  structure?: StructureType,
): structure is GatheringStructureType {
  return Boolean(
    structure &&
    GATHERING_STRUCTURE_TYPES.includes(structure as GatheringStructureType),
  );
}

export function pickStructureType(
  roll: number,
  resourceRoll: number,
  terrain: Terrain,
) {
  const globalStructure = STRUCTURE_CONFIGS.find(
    (config) =>
      typeof config.globalAppearanceThreshold === 'number' &&
      roll > config.globalAppearanceThreshold,
  );
  if (globalStructure) return globalStructure.type;

  const resourceStructure = STRUCTURE_CONFIGS.find(
    (config) =>
      typeof config.appearanceChanceByTerrain?.[terrain] === 'number' &&
      resourceRoll > (config.appearanceChanceByTerrain[terrain] ?? 1),
  );

  return resourceStructure?.type;
}

function buildStructureTags(config: StructureConfig) {
  const categoryTag =
    config.gathering != null
      ? GAME_TAGS.structure.gathering
      : config.type === 'dungeon'
        ? GAME_TAGS.structure.combat
        : config.type === 'camp' ||
            config.type === 'forge' ||
            config.type === 'rune-forge' ||
            config.type === 'furnace' ||
            config.type === 'mana-font' ||
            config.type === 'workshop' ||
            config.type === 'corruption-altar'
          ? GAME_TAGS.structure.crafting
          : config.type === 'town'
            ? GAME_TAGS.structure.settlement
            : GAME_TAGS.structure.utility;

  const typeTag =
    config.type === 'camp'
      ? GAME_TAGS.structure.camp
      : config.type === 'town'
        ? GAME_TAGS.structure.town
        : config.type === 'forge'
          ? GAME_TAGS.structure.forge
          : config.type === 'furnace'
            ? GAME_TAGS.structure.furnace
            : config.type === 'workshop'
              ? GAME_TAGS.structure.workshop
              : config.type === 'dungeon'
                ? GAME_TAGS.structure.dungeon
                : config.type === 'tree'
                  ? GAME_TAGS.structure.tree
                  : config.type === 'herbs'
                    ? GAME_TAGS.structure.herbs
                    : config.type === 'pond' || config.type === 'lake'
                      ? GAME_TAGS.structure.fishing
                      : config.type === 'copper-ore' ||
                          config.type === 'tin-ore' ||
                          config.type === 'iron-ore' ||
                          config.type === 'gold-ore' ||
                          config.type === 'platinum-ore' ||
                          config.type === 'coal-ore'
                        ? GAME_TAGS.structure.ore
                        : undefined;

  return uniqueTags(
    ...(config.tags ?? []),
    categoryTag,
    typeTag,
    ...(config.gathering ? getSkillTags(config.gathering.skill) : []),
  );
}
