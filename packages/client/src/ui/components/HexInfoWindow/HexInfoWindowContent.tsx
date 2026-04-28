import { Button, ItemSlot as ItemSlotButton } from '@realmfall/ui';
import { t } from '../../../i18n';
import { ITEM_MODIFICATION_BALANCE } from '../../../game/config';
import { CombatWindowContent } from '../CombatWindow/CombatWindowContent';
import { Icons } from '../../icons';
import { stripBracketHotkeyLabel } from '../../hotkeyLabels';
import { BracketHotkeyLabel } from '../BracketHotkeyLabel';
import labelStyles from '../windowLabels.module.scss';
import type { HexInfoWindowProps } from './types';
import {
  HEX_INFO_COMPACT_CONTENT_SLOT_STYLE,
  HEX_INFO_CONTENT_SLOT_STYLE,
} from './hexInfoSlotStyles';
import styles from './styles.module.scss';

type HexInfoWindowContentProps = Omit<
  HexInfoWindowProps,
  'position' | 'onMove' | 'visible' | 'onClose' | 'isHome' | 'onSetHome'
>;

export function HexInfoWindowContent({
  hexDescription,
  canBulkProspectEquipment,
  itemModification,
  onApplyItemModification = () => undefined,
  onClearItemModificationSelection = () => undefined,
  onSelectItemModificationReforgeStat = () => undefined,
  onToggleItemModificationPicker = () => undefined,
  onProspect,
  structureHp,
  structureMaxHp,
  townStock,
  gold,
  equipment = {},
  loot = [],
  combat = null,
  combatPlayerParty = [],
  combatEnemies = [],
  onBuyItem,
  onTakeAll = () => undefined,
  onTakeItem = () => undefined,
  onHoverItem,
  onLeaveItem,
  onHoverDetail,
  onLeaveDetail,
}: HexInfoWindowContentProps) {
  const hpPercent =
    structureHp != null && structureMaxHp
      ? Math.max(0, Math.min(100, (structureHp / structureMaxHp) * 100))
      : 0;
  const hoverDetail = onHoverDetail ?? (() => undefined);
  const leaveDetail = onLeaveDetail ?? (() => undefined);
  const selectedItemForModification = itemModification?.selectedItem ?? null;
  const hasContent = Boolean(
    combat ||
    (structureHp != null && structureMaxHp != null) ||
    canBulkProspectEquipment ||
    itemModification ||
    townStock.length > 0 ||
    loot.length > 0,
  );
  const prospectActionLabel = t('ui.hexInfo.prospectAction');
  const takeAllActionLabel = t('ui.loot.takeAllAction');
  const takeAllTooltipTitle = stripBracketHotkeyLabel(takeAllActionLabel);

  return (
    <div className={styles.layout}>
      <section className={styles.primaryPanel}>
        <div className={styles.primaryViewport}>
          {combat ? (
            <CombatWindowContent
              combat={combat}
              playerParty={combatPlayerParty}
              enemies={combatEnemies}
              onHoverDetail={hoverDetail}
              onLeaveDetail={leaveDetail}
            />
          ) : (
            <div className={styles.meta}>
              {structureHp != null && structureMaxHp != null ? (
                <div className={styles.barBlock}>
                  <div className={styles.barLabel}>
                    <span>{t('ui.hexInfo.structureHpLabel')}</span>
                    <span>
                      {structureHp}/{structureMaxHp}
                    </span>
                  </div>
                  <div
                    className={styles.barTrack}
                    onMouseEnter={(event) =>
                      onHoverDetail?.(
                        event,
                        t('ui.hexInfo.structureHpLabel'),
                        [
                          {
                            kind: 'text',
                            text: t('ui.tooltip.bar.structureHp'),
                          },
                        ],
                        'rgba(248, 113, 113, 0.9)',
                      )
                    }
                    onMouseLeave={onLeaveDetail}
                  >
                    <div
                      className={styles.barFill}
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                </div>
              ) : null}

              {canBulkProspectEquipment ? (
                <div className={styles.actions}>
                  <Button onClick={onProspect}>
                    <BracketHotkeyLabel
                      label={prospectActionLabel}
                      hotkeyClassName={labelStyles.hotkey}
                    />
                  </Button>
                </div>
              ) : null}
              {!hasContent ? (
                <p className={styles.description}>{hexDescription}</p>
              ) : null}
              {itemModification ? (
                <div className={styles.itemModificationPanel}>
                  <div className={styles.itemModificationHeader}>
                    <span className={styles.sectionTitle}>
                      {t('ui.hexInfo.itemModification.title', {
                        action: t(
                          `game.itemModification.${itemModification.kind}.label`,
                        ),
                      })}
                    </span>
                    <span
                      className={`${styles.itemModificationCost} ${
                        itemModification.canAfford
                          ? ''
                          : styles.itemModificationCostDisabled
                      }`.trim()}
                    >
                      {t('ui.hexInfo.itemModification.costLabel', {
                        gold: itemModification.actionCost ?? '-',
                      })}
                    </span>
                  </div>
                  <div className={styles.itemModificationPicker}>
                    <ItemSlotButton
                      ariaLabel={t('ui.hexInfo.itemModification.slotLabel')}
                      item={itemModification.selectedItem ?? undefined}
                      style={HEX_INFO_CONTENT_SLOT_STYLE}
                      className={
                        itemModification.pickerActive
                          ? styles.itemModificationSlotActive
                          : undefined
                      }
                      overlayColorOverride={
                        itemModification.pickerActive
                          ? 'rgba(56, 189, 248, 0.24)'
                          : undefined
                      }
                      onClick={onToggleItemModificationPicker}
                      onContextMenu={
                        itemModification.selectedItem
                          ? (event) => {
                              event.preventDefault();
                              onClearItemModificationSelection();
                            }
                          : undefined
                      }
                      onMouseEnter={
                        selectedItemForModification
                          ? (event) =>
                              onHoverItem(
                                event,
                                selectedItemForModification,
                                selectedItemForModification.slot
                                  ? equipment[selectedItemForModification.slot]
                                  : undefined,
                              )
                          : undefined
                      }
                      onMouseLeave={
                        selectedItemForModification ? onLeaveItem : undefined
                      }
                    />
                    <div className={styles.itemModificationMeta}>
                      <div className={styles.itemModificationSelection}>
                        {selectedItemForModification?.name ??
                          t('ui.hexInfo.itemModification.emptySelection')}
                      </div>
                      <div className={styles.itemModificationHint}>
                        {itemModification.pickerActive
                          ? t('ui.hexInfo.itemModification.pickerActiveHint')
                          : itemModification.hint}
                      </div>
                    </div>
                  </div>

                  {itemModification.kind === 'reforge' ? (
                    <label className={styles.itemModificationField}>
                      <span className={styles.label}>
                        {t('ui.hexInfo.itemModification.reforgeStatLabel')}
                      </span>
                      <select
                        className={styles.itemModificationSelect}
                        value={itemModification.selectedReforgeStatIndex ?? ''}
                        onChange={(event) =>
                          onSelectItemModificationReforgeStat(
                            Number(event.currentTarget.value),
                          )
                        }
                        disabled={itemModification.reforgeOptions.length === 0}
                      >
                        {itemModification.reforgeOptions.map((option) => (
                          <option
                            key={option.statIndex}
                            value={option.statIndex}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  {itemModification.kind === 'corrupt' ? (
                    <div className={styles.itemModificationWarning}>
                      {t('ui.hexInfo.itemModification.corruptionWarning', {
                        chance: Math.round(
                          ITEM_MODIFICATION_BALANCE.corrupt.breakChance * 100,
                        ),
                      })}
                    </div>
                  ) : null}

                  <div className={styles.itemModificationActions}>
                    <Button
                      type="button"
                      onClick={onApplyItemModification}
                      disabled={!itemModification.canApply}
                    >
                      {t(
                        `game.itemModification.${itemModification.kind}.label`,
                      )}
                    </Button>
                  </div>

                  {itemModification.disabledReason ? (
                    <div className={styles.empty}>
                      {itemModification.disabledReason}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {townStock.length > 0 ? (
                <div className={styles.shop}>
                  <div className={styles.shopGrid}>
                    {townStock.map(({ item, price }) => {
                      const affordable = gold >= price;

                      return (
                        <div key={item.id} className={styles.shopCard}>
                          <ItemSlotButton
                            item={item}
                            style={HEX_INFO_CONTENT_SLOT_STYLE}
                            badgeLabel={`${price}`}
                            badgeIcon={Icons.Coins}
                            badgeIconLabel={t('game.item.gold.name')}
                            className={
                              affordable ? undefined : styles.shopItemDisabled
                            }
                            onClick={
                              affordable ? () => onBuyItem(item.id) : undefined
                            }
                            onMouseEnter={(event) =>
                              onHoverItem(
                                event,
                                item,
                                item.slot ? equipment[item.slot] : undefined,
                              )
                            }
                            onMouseLeave={onLeaveItem}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {loot.length > 0 ? (
        <section className={styles.lootSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>{t('ui.loot.title')}</span>
            <Button
              type="button"
              onClick={onTakeAll}
              onMouseEnter={(event) =>
                onHoverDetail?.(
                  event,
                  takeAllTooltipTitle,
                  [{ kind: 'text', text: t('ui.tooltip.window.takeAllLoot') }],
                  'rgba(74, 222, 128, 0.9)',
                )
              }
              onMouseLeave={onLeaveDetail}
            >
              <BracketHotkeyLabel
                label={takeAllActionLabel}
                hotkeyClassName={labelStyles.hotkey}
              />
            </Button>
          </div>
          <div className={styles.lootGrid}>
            {loot.map((item) => (
              <ItemSlotButton
                key={item.id}
                item={item}
                size="compact"
                style={HEX_INFO_COMPACT_CONTENT_SLOT_STYLE}
                onClick={() => onTakeItem(item.id)}
                onMouseEnter={(event) =>
                  onHoverItem(
                    event,
                    item,
                    item.slot ? equipment[item.slot] : undefined,
                  )
                }
                onMouseLeave={onLeaveItem}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
