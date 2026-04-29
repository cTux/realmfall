import { Button } from '@realmfall/ui';
import { memo, useEffect, useState } from 'react';
import {
  INVENTORY_SORT_MODES,
  type InventorySortMode,
} from '../../../game/inventory';
import { t } from '../../../i18n';
import { WINDOW_LABELS } from '../../windowLabels';
import { DeferredWindowShell } from '../DeferredWindowShell';
import { createLazyWindowComponent } from '../lazyWindowComponent';
import { WindowHeaderActionButton } from '../WindowHeaderActionButton';
import type { InventoryWindowProps } from './types';
import styles from './styles.module.scss';

type InventoryWindowContentProps = Parameters<
  (typeof import('./InventoryWindowContent'))['InventoryWindowContent']
>[0];

const InventoryWindowContent =
  createLazyWindowComponent<InventoryWindowContentProps>(() =>
    import('./InventoryWindowContent').then((module) => ({
      default: module.InventoryWindowContent,
    })),
  );

const INVENTORY_SORT_LABEL_KEYS: Record<InventorySortMode, string> = {
  type: 'ui.tooltip.type',
  rarity: 'ui.tooltip.rarity',
  tier: 'ui.inventory.sort.tier',
  name: 'ui.inventory.sort.name',
};

export const InventoryWindow = memo(function InventoryWindow({
  position,
  onMove,
  visible,
  onClose,
  inventory,
  equipment,
  hexItemModificationPickerActive,
  learnedRecipeIds,
  onSort,
  onActivateItem,
  onSellItem,
  onContextItem,
  onSelectHexItemModificationItem,
  inTownForQuickSell,
  onHoverItem,
  onLeaveItem,
  onHoverDetail,
  onLeaveDetail,
}: InventoryWindowProps) {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedSortMode, setSelectedSortMode] =
    useState<InventorySortMode>('type');

  useEffect(() => {
    if (!visible) {
      setShowSortMenu(false);
    }
  }, [visible]);

  const handleSortSelection = (mode: InventorySortMode) => {
    setSelectedSortMode(mode);
    setShowSortMenu(false);
    onSort(mode);
  };

  return (
    <DeferredWindowShell
      title={WINDOW_LABELS.inventory.plain}
      hotkeyLabel={WINDOW_LABELS.inventory}
      position={position}
      onMove={onMove}
      className={styles.window}
      bodyClassName={styles.windowBody}
      visible={visible}
      externalUnmount
      onClose={onClose}
      resizeBounds={{ minWidth: 320, minHeight: 220 }}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
      headerActions={
        <div className={styles.toolbar}>
          <div className={styles.actions}>
            <WindowHeaderActionButton
              className={styles.headerButton}
              onClick={() => setShowSortMenu((current) => !current)}
              ariaPressed={showSortMenu}
              tooltipTitle={t('ui.inventory.sortAction')}
              tooltipLines={[
                {
                  kind: 'text',
                  text: t('ui.tooltip.window.sortInventory'),
                },
              ]}
              tooltipBorderColor="rgba(74, 222, 128, 0.9)"
              onHoverDetail={onHoverDetail}
              onLeaveDetail={onLeaveDetail}
            >
              {t('ui.inventory.sortAction')}
            </WindowHeaderActionButton>
            {showSortMenu ? (
              <div className={styles.sortMenu}>
                {INVENTORY_SORT_MODES.map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    size="small"
                    unstyled
                    className={styles.sortOption}
                    aria-pressed={selectedSortMode === mode}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSortSelection(mode);
                    }}
                  >
                    {t(INVENTORY_SORT_LABEL_KEYS[mode])}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      }
      content={InventoryWindowContent}
      contentProps={{
        inventory,
        equipment,
        hexItemModificationPickerActive,
        learnedRecipeIds,
        onActivateItem,
        onSellItem,
        onContextItem,
        onSelectHexItemModificationItem,
        inTownForQuickSell,
        onHoverItem,
        onLeaveItem,
      }}
    />
  );
});
