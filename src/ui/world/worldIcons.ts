import playerIcon from '../../assets/icons/visored-helm.svg';
import sunCloudIcon from '../../assets/icons/sun-cloud.svg';
import rainingIcon from '../../assets/icons/raining.svg';
import snowingIcon from '../../assets/icons/snowing.svg';
import tearTracksIcon from '../../assets/icons/tear-tracks.svg';
import { getEnemyConfig } from '../../game/content/enemies';
import { getStructureConfig } from '../../game/content/structures';
import type { Enemy, StructureType } from '../../game/state';

export const WorldIcons = {
  Player: playerIcon,
  SunCloud: sunCloudIcon,
  Raining: rainingIcon,
  Snowing: snowingIcon,
  Village: tearTracksIcon,
} as const;

export function enemyIconFor(
  enemy: Pick<Enemy, 'enemyTypeId' | 'name'> | string,
) {
  const lookup =
    typeof enemy === 'string' ? enemy : (enemy.enemyTypeId ?? enemy.name);
  return (
    getEnemyConfig(lookup)?.icon ??
    getEnemyConfig('wolf')?.icon ??
    WorldIcons.Player
  );
}

export function structureIconFor(structure: StructureType) {
  return getStructureConfig(structure).icon;
}
