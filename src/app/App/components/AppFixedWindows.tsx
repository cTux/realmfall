import { t } from '../../../i18n';
import { canEquipItem, canUseItem, isEquippableItem } from '../../../game/state';
import { DebuggerWindow } from '../../../ui/components/DebuggerWindow';
import { GameTooltip } from '../../../ui/components/GameTooltip';
import { HeroWindow } from '../../../ui/components/HeroWindow';
import { ItemContextMenu } from '../../../ui/components/ItemContextMenu';
import { WindowDock } from '../../../ui/components/WindowDock';
import type { AppWindowsProps } from '../AppWindows.types';
import type { TooltipState } from '../types';
import { getRecipeMaterialItemKey } from '../utils/getRecipeMaterialItemKey';

interface AppFixedWindowsProps {
  dockEntries: ReturnType<
    typeof import('../utils/getDockEntries').getDockEntries
  >;
  tooltip: TooltipState | null;
  windowCloseHandlers: ReturnType<
    typeof import('../hooks/useAppWindowHandlers').useAppWindowHandlers
  >['windowCloseHandlers'];
  windowMoveHandlers: ReturnType<
    typeof import('../hooks/useAppWindowHandlers').useAppWindowHandlers
  >['windowMoveHandlers'];
}

export function AppFixedWindows({
  dockEntries,
  tooltip,
  windowCloseHandlers,
  windowMoveHandlers,
  ...props
}: AppWindowsProps & AppFixedWindowsProps) {
  const { actions, layout, views } = props;
  const { itemMenu } = views;
  const recipeMaterialItemKey = itemMenu
    ? getRecipeMaterialItemKey(itemMenu.item)
    : null;

  return (
    <>
      <WindowDock
        entries={dockEntries}
        onToggle={actions.windows.onToggleDockWindow}
      />
      {layout.windowShown.worldTime ? (
        <DebuggerWindow
          position={layout.windows.worldTime}
          onMove={windowMoveHandlers.worldTime}
          visible={layout.windowShown.worldTime}
          onClose={windowCloseHandlers.worldTime}
          worldTimeMs={views.hero.worldTimeMs}
          onHoverDetail={actions.tooltip.onShowTooltip}
          onLeaveDetail={actions.tooltip.onCloseTooltip}
        />
      ) : null}
      <HeroWindow
        position={layout.windows.hero}
        onMove={windowMoveHandlers.hero}
        visible={layout.windowShown.hero}
        onClose={windowCloseHandlers.hero}
        stats={views.hero.stats}
        hunger={views.hero.hunger}
        thirst={views.hero.thirst}
        worldTimeMs={views.hero.worldTimeMs}
        onHoverDetail={actions.tooltip.onShowTooltip}
        onLeaveDetail={actions.tooltip.onCloseTooltip}
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
          canProspectInventoryEquipment={
            itemMenu.canProspectInventoryEquipment
          }
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
      <GameTooltip tooltip={tooltip} positionRef={layout.tooltipPositionRef} />
    </>
  );
}
