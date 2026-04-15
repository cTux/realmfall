import { canEquipItem, canUseItem } from '../../../game/state';
import { DebuggerWindow } from '../../../ui/components/DebuggerWindow';
import { GameTooltip } from '../../../ui/components/GameTooltip';
import { HeroWindow } from '../../../ui/components/HeroWindow';
import { ItemContextMenu } from '../../../ui/components/ItemContextMenu';
import { WindowDock } from '../../../ui/components/WindowDock';
import type { AppWindowsProps } from '../AppWindows.types';
import type { TooltipState } from '../types';

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
          worldTimeMs={views.worldTimeMs}
          onHoverDetail={actions.tooltip.onShowTooltip}
          onLeaveDetail={actions.tooltip.onCloseTooltip}
        />
      ) : null}
      <HeroWindow
        position={layout.windows.hero}
        onMove={windowMoveHandlers.hero}
        visible={layout.windowShown.hero}
        onClose={windowCloseHandlers.hero}
        stats={views.stats}
        hunger={views.game.player.hunger}
        thirst={views.game.player.thirst}
        worldTimeMs={views.game.worldTimeMs}
        onHoverDetail={actions.tooltip.onShowTooltip}
        onLeaveDetail={actions.tooltip.onCloseTooltip}
      />
      {itemMenu ? (
        <ItemContextMenu
          item={itemMenu.item}
          x={itemMenu.x}
          y={itemMenu.y}
          equipLabel={itemMenu.slot ? 'Unequip' : 'Equip'}
          canEquip={itemMenu.slot ? true : canEquipItem(itemMenu.item)}
          canUse={canUseItem(itemMenu.item)}
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
          onClose={actions.tooltip.onCloseItemMenu}
        />
      ) : null}
      <GameTooltip tooltip={tooltip} positionRef={layout.tooltipPositionRef} />
    </>
  );
}
