import playerIcon from '../../../assets/icons/visored-helm.svg';
import sunCloudIcon from '../../../assets/icons/sun-cloud.svg';
import sparklesIcon from '../../../assets/icons/sparkles.svg';
import bookCoverIcon from '../../../assets/icons/book-cover.svg';
import villageIcon from '../../../assets/icons/village.svg';
import armorIcon from '../../../assets/icons/checked-shield.svg';
import coinsIcon from '../../../assets/icons/coins.svg';
import stonePileIcon from '../../../assets/icons/stone-pile.svg';
import logIcon from '../../../assets/icons/log.svg';
import enemyIcon from '../../../assets/icons/wolf-head.svg';
import gearsIcon from '../../../assets/icons/gears.svg';
import audioPlayerIcon from '../../../assets/game-icons/delapouite/sound-on.svg';
import type { WindowVisibilityState } from '../../constants';

export const DOCK_WINDOW_ICONS: Record<keyof WindowVisibilityState, string> = {
  worldTime: sunCloudIcon,
  hero: playerIcon,
  audioPlayer: audioPlayerIcon,
  skills: sparklesIcon,
  recipes: bookCoverIcon,
  hexInfo: villageIcon,
  equipment: armorIcon,
  inventory: coinsIcon,
  loot: stonePileIcon,
  log: logIcon,
  combat: enemyIcon,
  settings: gearsIcon,
};
