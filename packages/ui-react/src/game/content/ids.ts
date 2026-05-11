export type ItemKey = string;

export enum EquipmentSlotId {
  Weapon = 'weapon',
  Offhand = 'offhand',
  Head = 'head',
  Shoulders = 'shoulders',
  Chest = 'chest',
  Bracers = 'bracers',
  Hands = 'hands',
  Belt = 'belt',
  Legs = 'legs',
  Feet = 'feet',
  RingLeft = 'ringLeft',
  RingRight = 'ringRight',
  Amulet = 'amulet',
  Cloak = 'cloak',
  Relic = 'relic',
}

export type EquipmentSlotValue = `${EquipmentSlotId}`;
