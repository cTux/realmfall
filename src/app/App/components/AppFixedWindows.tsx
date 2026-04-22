import { memo } from 'react';
import { t } from '../../../i18n';
import {
  canEquipItem,
  canUseItem,
  isEquippableItem,
} from '../../../game/state';
import { GameTooltip } from '../../../ui/components/GameTooltip';
import { HeroWindow } from '../../../ui/components/HeroWindow';
import { ItemContextMenu } from '../../../ui/components/ItemContextMenu';
import { WindowDock } from '../../../ui/components/WindowDock';
import { ActionBar } from '../../../ui/components/ActionBar/ActionBar';
import type {
  AppWindowsActions,
  AppWindowsLayout,
  AppWindowsViewState,
} from '../AppWindows.types';
import { useTooltipState } from '../tooltipStore';
import { getRecipeMaterialItemKey } from '../utils/getRecipeMaterialItemKey';

interface AppFixedWindowsProps {
  dockEntries: ReturnType<
    typeof import('../utils/getDockEntries').getDockEntries
  >;
  managedWindowProps: ReturnType<
    typeof import('../hooks/useManagedWindowProps').useManagedWindowProps
  >;
  tooltipPositionRef: AppWindowsLayout['tooltipPositionRef'];
  heroView: AppWindowsViewState['hero'];
  playerView: AppWindowsViewState['player'];
  itemMenu: AppWindowsViewState['itemMenu'];
  windowActions: AppWindowsActions['windows'];
  tooltipActions: AppWindowsActions['tooltip'];
  inventoryActions: AppWindowsActions['inventory'];
  recipeActions: AppWindowsActions['recipes'];
}

export const AppFixedWindows = memo(function AppFixedWindows({
  dockEntries,
  heroView,
  inventoryActions,
  itemMenu,
  managedWindowProps,
  playerView,
  recipeActions,
  tooltipActions,
  tooltipPositionRef,
  windowActions,
}: AppFixedWindowsProps) {
  const detailTooltipHandlers = {
    onHoverDetail: tooltipActions.onShowTooltip,
    onLeaveDetail: tooltipActions.onCloseTooltip,
  };
  const recipeMaterialItemKey = itemMenu
    ? getRecipeMaterialItemKey(itemMenu.item)
    : null;

  return (
    <>
      <WindowDock
        entries={dockEntries}
        onToggle={windowActions.onToggleDockWindow}
      />
      <ActionBar
        inventory={playerView.inventory}
        slots={playerView.actionBarSlots}
        onAssignSlot={inventoryActions.onAssignActionBarSlot}
        onClearSlot={inventoryActions.onClearActionBarSlot}
        onHoverItem={tooltipActions.onShowActionBarItemTooltip}
        onLeaveItem={tooltipActions.onCloseTooltip}
      />
      <HeroWindow
        {...managedWindowProps.hero}
        stats={heroView.stats}
        hunger={heroView.hunger}
        thirst={heroView.thirst}
        {...detailTooltipHandlers}
      />
      {itemMenu ? (
        <ItemContextMenu
          item={itemMenu.item}
          x={itemMenu.x}
          y={itemMenu.y}
          equipLabel={
            itemMenu.slot
              ? t('ui.itemMenu.unequipAction')
              : t('ui.itemMenu.equipAction')
          }
          canEquip={itemMenu.slot ? true : canEquipItem(itemMenu.item)}
          canUse={canUseItem(itemMenu.item, playerView.learnedRecipeIds)}
          canToggleLock={!itemMenu.slot && isEquippableItem(itemMenu.item)}
          isLocked={Boolean(itemMenu.item.locked)}
          canShowRecipes={Boolean(recipeMaterialItemKey)}
          canProspectItem={itemMenu.canProspectItem}
          canSellEntry={itemMenu.canSellEntry}
          reforgeOptions={itemMenu.reforgeOptions}
          enchantCost={itemMenu.enchantCost}
          corruptCost={itemMenu.corruptCost}
          onEquip={() => {
            if (itemMenu.slot) {
              inventoryActions.onUnequip(itemMenu.slot);
            } else {
              inventoryActions.onEquipItem(itemMenu.item.id);
            }
            tooltipActions.onCloseItemMenu();
          }}
          onUse={() => {
            inventoryActions.onUseItem(itemMenu.item.id);
            tooltipActions.onCloseItemMenu();
          }}
          onDrop={() => {
            if (itemMenu.slot) {
              inventoryActions.onDropEquippedItem(itemMenu.slot);
            } else {
              inventoryActions.onDropItem(itemMenu.item.id);
            }
            tooltipActions.onCloseItemMenu();
          }}
          onToggleLock={() => {
            inventoryActions.onSetItemLocked(
              itemMenu.item.id,
              !itemMenu.item.locked,
            );
            tooltipActions.onCloseItemMenu();
          }}
          onShowRecipes={() => {
            if (!recipeMaterialItemKey) return;
            recipeActions.onOpenWithMaterialFilter(recipeMaterialItemKey);
            tooltipActions.onCloseItemMenu();
          }}
          onProspect={() => {
            inventoryActions.onProspectItem(itemMenu.item.id);
            tooltipActions.onCloseItemMenu();
          }}
          onReforge={(statIndex) => {
            inventoryActions.onReforgeItem(itemMenu.item.id, statIndex);
            tooltipActions.onCloseItemMenu();
          }}
          onEnchant={() => {
            inventoryActions.onEnchantItem(itemMenu.item.id);
            tooltipActions.onCloseItemMenu();
          }}
          onCorrupt={() => {
            inventoryActions.onCorruptItem(itemMenu.item.id);
            tooltipActions.onCloseItemMenu();
          }}
          onSell={() => {
            inventoryActions.onSellItem(itemMenu.item.id);
            tooltipActions.onCloseItemMenu();
          }}
          onClose={tooltipActions.onCloseItemMenu}
        />
      ) : null}
      <TooltipLayer tooltipPositionRef={tooltipPositionRef} />
    </>
  );
});

function TooltipLayer({
  tooltipPositionRef,
}: Pick<AppWindowsLayout, 'tooltipPositionRef'>) {
  const tooltip = useTooltipState();
  return <GameTooltip tooltip={tooltip} positionRef={tooltipPositionRef} />;
}
