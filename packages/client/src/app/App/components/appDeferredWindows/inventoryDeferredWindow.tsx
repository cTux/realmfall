import { canSellItem } from '../../../../game/inventory';
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
      inTownForQuickSell={views.hex.currentTile.structure === 'town'}
      {...managedWindowProps.inventory}
      inventory={views.inventory.inventory}
      equipment={views.inventory.equipment}
      learnedRecipeIds={views.inventory.learnedRecipeIds}
      onSort={actions.inventory.onSort}
      onActivateItem={actions.inventory.onActivateItem}
      onSellItem={actions.inventory.onSellItem}
      onContextItem={actions.inventory.onContextItem}
      onSelectHexItemModificationItem={
        actions.inventory.onSelectHexItemModificationItem
      }
      hexItemModificationPickerActive={Boolean(
        views.hex.itemModification?.pickerActive,
      )}
      onHoverItem={(event, item, equipped) =>
        actions.tooltip.onShowItemTooltip(
          event,
          item,
          equipped,
          views.hex.currentTile.structure === 'town' && canSellItem(item),
        )
      }
      onLeaveItem={actions.tooltip.onCloseTooltip}
      {...detailTooltipHandlers}
    />
  ),
};
