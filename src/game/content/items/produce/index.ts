import { aubergineItemConfig } from './aubergine';
import { beetItemConfig } from './beet';
import { cabbageItemConfig } from './cabbage';
import { carrotItemConfig } from './carrot';
import { cherryItemConfig } from './cherry';
import { garlicItemConfig } from './garlic';
import { leekItemConfig } from './leek';
import { lemonItemConfig } from './lemon';
import { meatItemConfig } from './meat';
import { peasItemConfig } from './peas';
import { pepperItemConfig } from './pepper';
import { tomatoItemConfig } from './tomato';

export const PRODUCE_ITEM_CONFIGS = [
  beetItemConfig,
  pepperItemConfig,
  cabbageItemConfig,
  carrotItemConfig,
  cherryItemConfig,
  garlicItemConfig,
  leekItemConfig,
  lemonItemConfig,
  peasItemConfig,
  tomatoItemConfig,
  aubergineItemConfig,
  meatItemConfig,
] as const;

