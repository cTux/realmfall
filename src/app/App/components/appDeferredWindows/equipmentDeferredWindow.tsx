import { createLazyWindowComponent } from '../../../../ui/components/lazyWindowComponent';
import { loadNamedWindowModule } from './lazyDeferredWindowModule';
import type { AppDeferredWindowDescriptor } from './types';

const EquipmentWindow = createLazyWindowComponent<
  Parameters<
    (typeof import('../../../../ui/components/EquipmentWindow'))['EquipmentWindow']
  >[0]
>(
  loadNamedWindowModule(() =>
    import('../../../../ui/components/EquipmentWindow').then(
      (module) => module.EquipmentWindow,
    ),
  ),
);

export const equipmentDeferredWindow: AppDeferredWindowDescriptor = {
  key: 'equipment',
  render: ({ actions, detailTooltipHandlers, managedWindowProps, views }) => (
    <EquipmentWindow
      {...managedWindowProps.equipment}
      equipment={views.inventory.equipment}
      onHoverItem={actions.tooltip.onEquipmentHover}
      onLeaveItem={actions.tooltip.onCloseTooltip}
      onUnequip={actions.inventory.onUnequip}
      onContextItem={actions.inventory.onEquippedContextItem}
      onSelectHexItemModificationItem={
        actions.inventory.onSelectHexItemModificationItem
      }
      hexItemModificationPickerActive={Boolean(
        views.hex.itemModification?.pickerActive,
      )}
      {...detailTooltipHandlers}
    />
  ),
};
