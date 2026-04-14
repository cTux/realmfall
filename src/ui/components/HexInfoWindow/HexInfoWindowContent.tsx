import { iconForItem, itemTint } from '../../icons';
import { t } from '../../../i18n';
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
  canClaim,
  claimExplanation,
  canProspect,
  canSell,
  prospectExplanation,
  sellExplanation,
  territoryNpc,
  onClaim,
  onProspect,
  onSellAll,
  structureHp,
  structureMaxHp,
  territoryName,
  territoryOwnerType,
  townStock,
  gold,
  onBuyItem,
  onHoverItem,
  onLeaveItem,
}: HexInfoWindowContentProps) {
  const hpPercent =
    structureHp != null && structureMaxHp
      ? Math.max(0, Math.min(100, (structureHp / structureMaxHp) * 100))
      : 0;

  return (
    <div className={styles.meta}>
      <div className={styles.row}>
        <span className={styles.label}>{t('ui.hexInfo.terrainLabel')}</span>
        <span className={styles.value}>{terrain}</span>
      </div>
      {structure ? (
        <div className={styles.row}>
          <span className={styles.label}>{t('ui.hexInfo.structureLabel')}</span>
          <span className={styles.value}>{structure}</span>
        </div>
      ) : null}
      {enemyCount > 0 ? (
        <div className={styles.row}>
          <span className={styles.label}>{t('ui.hexInfo.enemiesLabel')}</span>
          <span className={styles.value}>{enemyCount}</span>
        </div>
      ) : null}
      {territoryName ? (
        <div className={styles.row}>
          <span className={styles.label}>{t('ui.hexInfo.territoryLabel')}</span>
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
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className={styles.actions}>
        <button onClick={onClaim} disabled={!canClaim}>
          {t('ui.hexInfo.claimAction')}
        </button>
        {canProspect ? (
          <button onClick={onProspect}>{t('ui.hexInfo.prospectAction')}</button>
        ) : null}
        {canSell ? (
          <button onClick={onSellAll}>{t('ui.hexInfo.sellAllAction')}</button>
        ) : null}
      </div>

      {claimExplanation ? (
        <div className={styles.empty}>{claimExplanation}</div>
      ) : null}
      {prospectExplanation ? (
        <div className={styles.empty}>{prospectExplanation}</div>
      ) : null}
      {sellExplanation ? (
        <div className={styles.empty}>{sellExplanation}</div>
      ) : null}
      {territoryNpc ? (
        <div className={styles.shop}>
          <div className={styles.shopTitle}>{t('ui.hexInfo.npcsTitle')}</div>
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
          {townStock.map(({ item, price }) => (
            <div key={item.id} className={styles.shopRow}>
              <button
                className={styles.shopItem}
                onMouseEnter={(event) => onHoverItem(event, item)}
                onMouseLeave={onLeaveItem}
              >
                <span
                  className={styles.shopIcon}
                  style={iconMaskStyle(iconForItem(item), itemTint(item))}
                />
                <span>{item.name}</span>
              </button>
              <span>{price}g</span>
              <button
                onClick={() => onBuyItem(item.id)}
                disabled={gold < price}
              >
                {t('ui.hexInfo.buyAction')}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {!canClaim &&
      !canProspect &&
      !canSell &&
      townStock.length === 0 &&
      !territoryName ? (
        <div className={styles.empty}>{t('ui.hexInfo.empty')}</div>
      ) : null}
    </div>
  );
}

function iconMaskStyle(icon: string, color: string) {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    backgroundColor: color,
    WebkitMask: mask,
    mask,
  };
}
