import { ashenItemConfigs } from './sets/ashen';
import { dawnItemConfigs } from './sets/dawn';
import { duskItemConfigs } from './sets/dusk';
import { emberItemConfigs } from './sets/ember';
import { hollowItemConfigs } from './sets/hollow';
import { ironboundItemConfigs } from './sets/ironbound';
import { mossItemConfigs } from './sets/moss';
import { riftItemConfigs } from './sets/rift';
import { shardItemConfigs } from './sets/shard';
import { stormItemConfigs } from './sets/storm';
import { valeItemConfigs } from './sets/vale';
import { voidItemConfigs } from './sets/void';
import { wardenItemConfigs } from './sets/warden';

export const CRAFTED_EXPANSION_ITEM_CONFIGS = [
  ...ashenItemConfigs,
  ...dawnItemConfigs,
  ...duskItemConfigs,
  ...emberItemConfigs,
  ...hollowItemConfigs,
  ...ironboundItemConfigs,
  ...mossItemConfigs,
  ...riftItemConfigs,
  ...shardItemConfigs,
  ...stormItemConfigs,
  ...valeItemConfigs,
  ...voidItemConfigs,
  ...wardenItemConfigs,
] as const;
