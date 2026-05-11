import { createLazyWindowComponent } from '../../../../ui/components/lazyWindowComponent';
import { loadNamedWindowModule } from './lazyDeferredWindowModule';
import type { AppDeferredWindowDescriptor } from './types';

const DebugWindow = createLazyWindowComponent<
  Parameters<
    (typeof import('../../../../ui/components/DebugWindow'))['DebugWindow']
  >[0]
>(
  loadNamedWindowModule(() =>
    import('../../../../ui/components/DebugWindow').then(
      (module) => module.DebugWindow,
    ),
  ),
);

export const debugDeferredWindow: AppDeferredWindowDescriptor = {
  key: 'debug',
  render: ({ actions, managedWindowProps }) => (
    <DebugWindow
      {...managedWindowProps.debug}
      onCreateEquipmentItem={actions.debug.onCreateEquipmentItem}
      onCreateDropItem={actions.debug.onCreateDropItem}
      onSpawnEnemyNearby={actions.debug.onSpawnEnemyNearby}
      onTriggerBloodMoon={actions.debug.onTriggerBloodMoon}
      onTriggerHarvestMoon={actions.debug.onTriggerHarvestMoon}
      onTriggerEarthquake={actions.debug.onTriggerEarthquake}
      onSetMorning={actions.debug.onSetMorning}
      onSetNight={actions.debug.onSetNight}
    />
  ),
};
