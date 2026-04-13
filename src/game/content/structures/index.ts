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
import { campStructureConfig } from './camp';
import { coalOreStructureConfig } from './coalOre';
import { copperOreStructureConfig } from './copperOre';
import { dungeonStructureConfig } from './dungeon';
import { forgeStructureConfig } from './forge';
import { herbsStructureConfig } from './herbs';
import { ironOreStructureConfig } from './ironOre';
import { lakeStructureConfig } from './lake';
import { pondStructureConfig } from './pond';
import { townStructureConfig } from './town';
import { treeStructureConfig } from './tree';
import { workshopStructureConfig } from './workshop';

const RAW_STRUCTURE_CONFIGS = [
  dungeonStructureConfig,
  forgeStructureConfig,
  townStructureConfig,
  workshopStructureConfig,
  campStructureConfig,
  herbsStructureConfig,
  treeStructureConfig,
  copperOreStructureConfig,
  ironOreStructureConfig,
  coalOreStructureConfig,
  pondStructureConfig,
  lakeStructureConfig,
] as const;

export const STRUCTURE_CONFIGS: StructureConfig[] = RAW_STRUCTURE_CONFIGS.map(
  (config) => ({
    ...config,
    title: structureTitle(config.type),
    description: structureDescription(config.type),
    gathering: config.gathering
      ? {
          ...config.gathering,
          actionLabel: localizedStructureActionLabel(config.type),
          reward: itemName(
            config.gathering.reward.toLowerCase().replace(/\s+/g, '-'),
          ),
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
