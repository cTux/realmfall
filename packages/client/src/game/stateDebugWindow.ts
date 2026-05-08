export const DEBUG_EQUIPMENT_TYPES = [
  'weapon',
  'offhand',
  'armor',
  'artifact',
] as const;

export type DebugEquipmentType = (typeof DEBUG_EQUIPMENT_TYPES)[number];
