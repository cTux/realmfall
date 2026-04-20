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
import type { AppWindowsProps } from '../AppWindows.types';
import { useTooltipState } from '../tooltipStore';
import { getRecipeMaterialItemKey } from '../utils/getRecipeMaterialItemKey';

interface AppFixedWindowsProps {
  dockEntries: ReturnType<
    typeof import('../utils/getDockEntries').getDockEntries
  >;
  managedWindowProps: ReturnType<
    typeof import('../hooks/useManagedWindowProps').useManagedWindowProps
  >;
}

export function AppFixedWindows({
  dockEntries,
  managedWindowProps,
  ...props
}: AppWindowsProps & AppFixedWindowsProps) {
  const { actions, layout, views } = props;
  const { itemMenu } = views;
  const detailTooltipHandlers = {
    onHoverDetail: actions.tooltip.onShowTooltip,
    onLeaveDetail: actions.tooltip.onCloseTooltip,
  };
  const recipeMaterialItemKey = itemMenu
    ? getRecipeMaterialItemKey(itemMenu.item)
    : null;

  return (
    <>
      <WindowDock
        entries={dockEntries}
        onToggle={actions.windows.onToggleDockWindow}
      />
      <ActionBar
        inventory={views.player.inventory}
        slots={views.player.actionBarSlots}
        worldTimeMs={views.hero.worldTimeMs}
        consumableCooldownEndsAt={views.player.consumableCooldownEndsAt ?? 0}
        onAssignSlot={actions.inventory.onAssignActionBarSlot}
        onClearSlot={actions.inventory.onClearActionBarSlot}
        onHoverItem={actions.tooltip.onShowActionBarItemTooltip}
        onLeaveItem={actions.tooltip.onCloseTooltip}
      />
      <HeroWindow
        {...managedWindowProps.hero}
        stats={views.hero.stats}
        hunger={views.hero.hunger}
        thirst={views.hero.thirst}
        worldTimeMs={views.hero.worldTimeMs}
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
          canUse={canUseItem(itemMenu.item, views.player.learnedRecipeIds)}
          canToggleLock={!itemMenu.slot && isEquippableItem(itemMenu.item)}
          isLocked={Boolean(itemMenu.item.locked)}
          canShowRecipes={Boolean(recipeMaterialItemKey)}
          canProspectInventoryEquipment={itemMenu.canProspectInventoryEquipment}
          canSellInventoryEquipment={itemMenu.canSellInventoryEquipment}
          onEquip={() => {
            if (itemMenu.slot) {
              actions.inventory.onUnequip(itemMenu.slot);
            } else {
              actions.inventory.onEquip(itemMenu.item.id);
            }
            actions.tooltip.onCloseItemMenu();
          }}
          onUse={() => {
            actions.inventory.onUseItem(itemMenu.item.id);
            actions.tooltip.onCloseItemMenu();
          }}
          onDrop={() => {
            if (itemMenu.slot) {
              actions.inventory.onDropEquippedItem(itemMenu.slot);
            } else {
              actions.inventory.onDropItem(itemMenu.item.id);
            }
            actions.tooltip.onCloseItemMenu();
          }}
          onToggleLock={() => {
            actions.inventory.onSetItemLocked(
              itemMenu.item.id,
              !itemMenu.item.locked,
            );
            actions.tooltip.onCloseItemMenu();
          }}
          onShowRecipes={() => {
            if (!recipeMaterialItemKey) return;
            actions.recipes.onOpenWithMaterialFilter(recipeMaterialItemKey);
            actions.tooltip.onCloseItemMenu();
          }}
          onProspect={() => {
            actions.inventory.onProspectItem(itemMenu.item.id);
            actions.tooltip.onCloseItemMenu();
          }}
          onSell={() => {
            actions.inventory.onSellItem(itemMenu.item.id);
            actions.tooltip.onCloseItemMenu();
          }}
          onClose={actions.tooltip.onCloseItemMenu}
        />
      ) : null}
      <TooltipLayer tooltipPositionRef={layout.tooltipPositionRef} />
    </>
  );
}

function TooltipLayer({
  tooltipPositionRef,
}: Pick<AppWindowsProps['layout'], 'tooltipPositionRef'>) {
  const tooltip = useTooltipState();
  return <GameTooltip tooltip={tooltip} positionRef={tooltipPositionRef} />;
}
