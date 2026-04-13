import playerIcon from '../../assets/icons/visored-helm.svg';
import sunCloudIcon from '../../assets/icons/sun-cloud.svg';
import rainingIcon from '../../assets/icons/raining.svg';
import snowingIcon from '../../assets/icons/snowing.svg';
import { getEnemyConfig } from '../../game/content/enemies';
import { getStructureConfig } from '../../game/content/structures';
import type { StructureType } from '../../game/state';

export const WorldIcons = {
  Player: playerIcon,
  SunCloud: sunCloudIcon,
  Raining: rainingIcon,
  Snowing: snowingIcon,
} as const;

export function enemyIconFor(name: string) {
  return (
    getEnemyConfig(name)?.icon ??
    getEnemyConfig('Wolf')?.icon ??
    WorldIcons.Player
  );
}

export function structureIconFor(structure: StructureType) {
  return getStructureConfig(structure).icon;
}
