import type { StructureType } from '../../types';
import { STRUCTURE_FUNCTIONS, type StructureFunction } from '../types';
import { STRUCTURE_CONFIGS } from './structureCatalog';

const rawStructureTypesByFunction = STRUCTURE_FUNCTIONS.reduce(
  (structureTypesByFunction, structureFunction) => {
    structureTypesByFunction[structureFunction] = [];
    return structureTypesByFunction;
  },
  {} as Record<StructureFunction, StructureType[]>,
);

for (const config of STRUCTURE_CONFIGS) {
  for (const structureFunction of config.functionsProvided) {
    rawStructureTypesByFunction[structureFunction].push(config.type);
  }
}

const STRUCTURE_TYPES_BY_FUNCTION = Object.freeze(
  Object.fromEntries(
    Object.entries(rawStructureTypesByFunction).map(
      ([structureFunction, structureTypes]) => [
        structureFunction,
        Object.freeze([...structureTypes]),
      ],
    ),
  ) as Record<StructureFunction, readonly StructureType[]>,
);

export function getStructureTypesProvidingFunction(
  structureFunction: StructureFunction,
) {
  return STRUCTURE_TYPES_BY_FUNCTION[structureFunction];
}

export function getSingleStructureProvidingFunction(
  structureFunction: StructureFunction,
) {
  const structureTypes = getStructureTypesProvidingFunction(structureFunction);
  if (structureTypes.length > 1) {
    throw new Error(
      `Expected one structure providing ${structureFunction}, received ${structureTypes.join(', ')}.`,
    );
  }
  return structureTypes[0] ?? null;
}
