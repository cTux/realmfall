import { t } from '../../../i18n';
import { CombatWindowContent } from '../CombatWindow/CombatWindowContent';
import { ItemSlotButton } from '../ItemSlotButton/ItemSlotButton';
import type { HexInfoWindowProps } from './types';
import styles from './styles.module.scss';

type HexInfoWindowContentProps = Omit<
  HexInfoWindowProps,
  'position' | 'onMove' | 'visible' | 'onClose' | 'isHome' | 'onSetHome'
>;

export function HexInfoWindowContent({
  terrain,
  structure,
  enemyCount,
  interactLabel,
  canInteract,
  canTerritoryAction,
  territoryActionLabel,
  territoryActionExplanation,
  canBulkProspectEquipment,
  canBulkSellEquipment,
  bulkProspectEquipmentExplanation,
  bulkSellEquipmentExplanation,
  territoryNpc,
  onTerritoryAction,
  onProspect,
  onSellAll,
  structureHp,
  structureMaxHp,
  territoryName,
  territoryOwnerType,
  townStock,
  gold,
  equipment = {},
  loot = [],
  combat = null,
  combatPlayerParty = [],
  combatEnemies = [],
  combatWorldTimeMs,
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

  return (
    <div className={styles.layout}>
      <section className={styles.primaryPanel}>
        <div className={styles.primaryViewport}>
          {combat ? (
            <CombatWindowContent
              combat={combat}
              playerParty={combatPlayerParty}
              enemies={combatEnemies}
              worldTimeMs={combatWorldTimeMs}
              onHoverDetail={hoverDetail}
              onLeaveDetail={leaveDetail}
            />
          ) : (
            <div className={styles.meta}>
              <div className={styles.row}>
                <span className={styles.label}>
                  {t('ui.hexInfo.terrainLabel')}
                </span>
                <span className={styles.value}>{terrain}</span>
              </div>
              {structure ? (
                <div className={styles.row}>
                  <span className={styles.label}>
                    {t('ui.hexInfo.structureLabel')}
                  </span>
                  <span className={styles.value}>{structure}</span>
                </div>
              ) : null}
              {enemyCount > 0 ? (
                <div className={styles.row}>
                  <span className={styles.label}>
                    {t('ui.hexInfo.enemiesLabel')}
                  </span>
                  <span className={styles.value}>{enemyCount}</span>
                </div>
              ) : null}
              {territoryName ? (
                <div className={styles.row}>
                  <span className={styles.label}>
                    {t('ui.hexInfo.territoryLabel')}
                  </span>
                  <span className={styles.value}>
                    {territoryName}
                    {territoryOwnerType === 'player'
                      ? ` (${t('ui.hexInfo.playerTerritoryValue')})`
                      : ''}
                  </span>
                </div>
              ) : null}

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

              <div className={styles.actions}>
                <button
                  onClick={onTerritoryAction}
                  disabled={!canTerritoryAction}
                >
                  {territoryActionLabel}
                </button>
                {canBulkProspectEquipment ? (
                  <button onClick={onProspect}>
                    {t('ui.hexInfo.prospectAction')}
                  </button>
                ) : null}
                {canBulkSellEquipment ? (
                  <button onClick={onSellAll}>
                    {t('ui.hexInfo.sellAllAction')}
                  </button>
                ) : null}
              </div>

              {territoryActionExplanation ? (
                <div className={styles.empty}>{territoryActionExplanation}</div>
              ) : null}
              {bulkProspectEquipmentExplanation ? (
                <div className={styles.empty}>
                  {bulkProspectEquipmentExplanation}
                </div>
              ) : null}
              {bulkSellEquipmentExplanation ? (
                <div className={styles.empty}>
                  {bulkSellEquipmentExplanation}
                </div>
              ) : null}
              {territoryNpc ? (
                <div className={styles.shop}>
                  <div className={styles.shopTitle}>
                    {t('ui.hexInfo.npcsTitle')}
                  </div>
                  <div className={styles.shopRow}>
                    <span>{territoryNpc.name}</span>
                  </div>
                </div>
              ) : null}

              {townStock.length > 0 ? (
                <div className={styles.shop}>
                  <div className={styles.shopTitle}>
                    {t('ui.hexInfo.townStockTitle', { gold })}
                  </div>
                  <div className={styles.shopGrid}>
                    {townStock.map(({ item, price }) => {
                      const affordable = gold >= price;

                      return (
                        <div key={item.id} className={styles.shopCard}>
                          <ItemSlotButton
                            item={item}
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
                          <span
                            className={`${styles.shopPrice} ${
                              affordable ? '' : styles.shopPriceDisabled
                            }`.trim()}
                          >
                            {price}
                            {t('ui.hexInfo.buyPriceSuffix')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {!canTerritoryAction &&
              !(interactLabel && canInteract) &&
              !canBulkProspectEquipment &&
              !canBulkSellEquipment &&
              townStock.length === 0 &&
              !territoryName ? (
                <div className={styles.empty}>{t('ui.hexInfo.empty')}</div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <section className={styles.lootSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>{t('ui.loot.title')}</span>
          <button
            type="button"
            onClick={onTakeAll}
            disabled={loot.length === 0}
            onMouseEnter={(event) =>
              onHoverDetail?.(
                event,
                t('ui.loot.takeAllAction'),
                [{ kind: 'text', text: t('ui.tooltip.window.takeAllLoot') }],
                'rgba(74, 222, 128, 0.9)',
              )
            }
            onMouseLeave={onLeaveDetail}
          >
            {t('ui.loot.takeAllAction')}
          </button>
        </div>
        <div className={styles.lootGrid}>
          {loot.map((item) => (
            <ItemSlotButton
              key={item.id}
              item={item}
              size="compact"
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
          {loot.length === 0 ? (
            <div className={styles.empty}>{t('ui.common.empty')}</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
