import { createLazyWindowComponent } from '../../../../ui/components/lazyWindowComponent';
import { loadNamedWindowModule } from './lazyDeferredWindowModule';
import type { AppDeferredWindowDescriptor } from './types';

const InventoryWindow = createLazyWindowComponent<
  Parameters<
    (typeof import('../../../../ui/components/InventoryWindow'))['InventoryWindow']
  >[0]
>(
  loadNamedWindowModule(() =>
    import('../../../../ui/components/InventoryWindow').then(
      (module) => module.InventoryWindow,
    ),
  ),
);

export const inventoryDeferredWindow: AppDeferredWindowDescriptor = {
  key: 'inventory',
  render: ({ actions, detailTooltipHandlers, managedWindowProps, views }) => (
    <InventoryWindow
      {...managedWindowProps.inventory}
      inventory={views.inventory.inventory}
      equipment={views.inventory.equipment}
      learnedRecipeIds={views.inventory.learnedRecipeIds}
      onSort={actions.inventory.onSort}
      onActivateItem={actions.inventory.onActivateItem}
      onContextItem={actions.inventory.onContextItem}
      onSelectHexItemModificationItem={
        actions.inventory.onSelectHexItemModificationItem
      }
      hexItemModificationPickerActive={Boolean(
        views.hex.itemModification?.pickerActive,
      )}
      onHoverItem={actions.tooltip.onShowItemTooltip}
      onLeaveItem={actions.tooltip.onCloseTooltip}
      {...detailTooltipHandlers}
    />
  ),
};
