import type {
  EquipmentSlot,
  ItemKind,
  LogKind,
  SkillName,
  Terrain,
} from '../game/types';
import { t } from './index';

export function formatTerrainLabel(terrain: Terrain) {
  return t(`game.terrain.${terrain}.label`);
}

export function formatSkillLabel(skill: SkillName) {
  return t(`game.skill.${skill}.label`);
}

export function formatEquipmentSlotLabel(slot: EquipmentSlot) {
  return t(`ui.equipmentSlot.${slot}.label`);
}

export function formatItemKindLabel(kind: ItemKind) {
  return t(`ui.itemKind.${kind}.label`);
}

export function formatLogKindLabel(kind: LogKind) {
  return t(`ui.log.kind.${kind}.label`);
}

export function formatStatusEffectLabel(statusEffectName: string) {
  return t(`ui.statusEffect.${statusEffectName}.label`);
}
