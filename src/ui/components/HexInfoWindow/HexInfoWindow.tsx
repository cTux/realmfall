import { memo } from 'react';
import { iconForItem, itemTint } from '../../icons';
import { DraggableWindow } from '../DraggableWindow';
import type { HexInfoWindowProps } from './types';
import styles from './styles.module.css';

export const HexInfoWindow = memo(function HexInfoWindow({
  position,
  onMove,
  collapsed,
  onCollapsedChange,
  terrain,
  structure,
  enemyCount,
  interactLabel,
  canInteract,
  canProspect,
  canSell,
  prospectExplanation,
  sellExplanation,
  onInteract,
  onProspect,
  onSellAll,
  structureHp,
  structureMaxHp,
  townStock,
  gold,
  onBuyItem,
  onHoverItem,
  onLeaveItem,
}: HexInfoWindowProps) {
  const hpPercent =
    structureHp != null && structureMaxHp
      ? Math.max(0, Math.min(100, (structureHp / structureMaxHp) * 100))
      : 0;

  return (
    <DraggableWindow
      title="Hex Info"
      position={position}
      onMove={onMove}
      className={styles.window}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
    >
      <div className={styles.meta}>
        <div className={styles.row}>
          <span className={styles.label}>Terrain</span>
          <span className={styles.value}>{terrain}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Structure</span>
          <span className={styles.value}>{structure}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Enemies</span>
          <span className={styles.value}>{enemyCount}</span>
        </div>

        {structureHp != null && structureMaxHp != null ? (
          <div className={styles.barBlock}>
            <div className={styles.barLabel}>
              <span>Structure HP</span>
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
          {interactLabel ? (
            <button onClick={onInteract} disabled={!canInteract}>
              {interactLabel}
            </button>
          ) : null}
          {canProspect ? <button onClick={onProspect}>Prospect</button> : null}
          {canSell ? (
            <button onClick={onSellAll}>Sell all equippable</button>
          ) : null}
        </div>

        {prospectExplanation ? (
          <div className={styles.empty}>{prospectExplanation}</div>
        ) : null}
        {sellExplanation ? (
          <div className={styles.empty}>{sellExplanation}</div>
        ) : null}

        {townStock.length > 0 ? (
          <div className={styles.shop}>
            <div className={styles.shopTitle}>Town Stock · {gold} gold</div>
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
                  Buy
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {!interactLabel &&
        !canProspect &&
        !canSell &&
        townStock.length === 0 ? (
          <div className={styles.empty}>No special activity on this hex.</div>
        ) : null}
      </div>
    </DraggableWindow>
  );
});

function iconMaskStyle(icon: string, color: string) {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    backgroundColor: color,
    WebkitMask: mask,
    mask,
  };
}
