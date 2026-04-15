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
  const { itemMenu } = props;

  return (
    <>
      <WindowDock entries={dockEntries} onToggle={props.onToggleDockWindow} />
      {props.windowShown.worldTime ? (
        <DebuggerWindow
          position={props.windows.worldTime}
          onMove={windowMoveHandlers.worldTime}
          visible={props.windowShown.worldTime}
          onClose={windowCloseHandlers.worldTime}
          worldTimeMs={props.worldTimeMs}
          onHoverDetail={props.onShowTooltip}
          onLeaveDetail={props.onCloseTooltip}
        />
      ) : null}
      <HeroWindow
        position={props.windows.hero}
        onMove={windowMoveHandlers.hero}
        visible={props.windowShown.hero}
        onClose={windowCloseHandlers.hero}
        stats={props.stats}
        hunger={props.game.player.hunger}
        thirst={props.game.player.thirst}
        worldTimeMs={props.game.worldTimeMs}
        onHoverDetail={props.onShowTooltip}
        onLeaveDetail={props.onCloseTooltip}
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
              props.onUnequip(itemMenu.slot);
            } else {
              props.onEquip(itemMenu.item.id);
            }
            props.onCloseItemMenu();
          }}
          onUse={() => {
            props.onUseItem(itemMenu.item.id);
            props.onCloseItemMenu();
          }}
          onDrop={() => {
            if (itemMenu.slot) {
              props.onDropEquippedItem(itemMenu.slot);
            } else {
              props.onDropItem(itemMenu.item.id);
            }
            props.onCloseItemMenu();
          }}
          onClose={props.onCloseItemMenu}
        />
      ) : null}
      <GameTooltip tooltip={tooltip} positionRef={props.tooltipPositionRef} />
    </>
  );
}
