import { formatCompactNumber } from '../../formatters';
import type { TooltipLine } from '../../tooltips';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';
import styles from './styles.module.scss';

interface EntityStatusBar {
  id: string;
  label: string;
  value: number;
  max: number;
  tone: 'hp' | 'mana' | 'xp' | 'hunger' | 'thirst' | 'cast';
  description: string;
  text?: string;
  reserved?: boolean;
}

interface EntityStatusIcon {
  id: string;
  label: string;
  icon: string;
  tint: string;
  borderColor: string;
  tooltipTitle: string;
  tooltipLines: TooltipLine[];
  tooltipBorderColor: string;
  cooldownRatio?: number;
  remainingMs?: number;
}

interface EntityStatusPanelProps extends WindowDetailTooltipHandlers {
  className?: string;
  title: string;
  titleAccent?: { label: string; color: string };
  titleAccentPlacement?: 'inline' | 'top';
  showPrimaryLabel?: boolean;
  showPrimaryTitle?: boolean;
  bars: [EntityStatusBar, ...EntityStatusBar[]];
  abilities: EntityStatusIcon[];
  buffs: EntityStatusIcon[];
  debuffs: EntityStatusIcon[];
}

export function EntityStatusPanel({
  className,
  title,
  titleAccent,
  titleAccentPlacement = 'inline',
  showPrimaryLabel = true,
  showPrimaryTitle = true,
  bars,
  abilities,
  buffs,
  debuffs,
  onHoverDetail,
  onLeaveDetail,
}: EntityStatusPanelProps) {
  const [primaryBar, ...secondaryBars] = bars;

  return (
    <div className={[styles.panel, className ?? ''].filter(Boolean).join(' ')}>
      <div className={`${styles.iconRow} ${styles.topRow}`} aria-hidden={debuffs.length === 0}>
        {debuffs.map((icon) => (
          <StatusIcon
            key={icon.id}
            icon={icon}
            onHoverDetail={onHoverDetail}
            onLeaveDetail={onLeaveDetail}
          />
        ))}
      </div>
      <div className={styles.barStack}>
        <StatusBar
          bar={primaryBar}
          primary
          title={title}
          titleAccent={titleAccent}
          titleAccentPlacement={titleAccentPlacement}
          showPrimaryLabel={showPrimaryLabel}
          showPrimaryTitle={showPrimaryTitle}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
        {secondaryBars.map((bar) => (
          <StatusBar
            key={bar.id}
            bar={bar}
            onHoverDetail={onHoverDetail}
            onLeaveDetail={onLeaveDetail}
          />
        ))}
      </div>
      <div className={styles.bottomRow}>
        <div className={`${styles.iconRow} ${styles.bottomLeftRow}`}>
          {abilities.map((icon) => (
            <StatusIcon
              key={icon.id}
              icon={icon}
              onHoverDetail={onHoverDetail}
              onLeaveDetail={onLeaveDetail}
            />
          ))}
        </div>
        <div className={`${styles.iconRow} ${styles.bottomRightRow}`}>
          {buffs.map((icon) => (
            <StatusIcon
              key={icon.id}
              icon={icon}
              onHoverDetail={onHoverDetail}
              onLeaveDetail={onLeaveDetail}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBar({
  bar,
  primary = false,
  title,
  titleAccent,
  titleAccentPlacement = 'inline',
  showPrimaryLabel = true,
  showPrimaryTitle = true,
  onHoverDetail,
  onLeaveDetail,
}: WindowDetailTooltipHandlers & {
  bar: EntityStatusBar;
  primary?: boolean;
  title?: string;
  titleAccent?: { label: string; color: string };
  titleAccentPlacement?: 'inline' | 'top';
  showPrimaryLabel?: boolean;
  showPrimaryTitle?: boolean;
}) {
  const width = Math.max(0, Math.min(100, (bar.value / Math.max(1, bar.max)) * 100));
  const valueText = `${formatCompactNumber(bar.value)}/${formatCompactNumber(bar.max)}`;

  return (
    <div
      className={`${styles.bar} ${primary ? styles.primaryBar : styles.secondaryBar} ${
        bar.tone === 'cast' ? styles.castBar : ''
      } ${bar.reserved ? styles.reservedBar : ''}`}
      onMouseEnter={
        bar.reserved
          ? undefined
          : (event) =>
              onHoverDetail?.(
                event,
                bar.label,
                [{ kind: 'text', text: bar.description }],
                toneBorderColor(bar.tone),
              )
      }
      onMouseLeave={bar.reserved ? undefined : onLeaveDetail}
    >
      {bar.reserved ? null : (
        <div
          className={`${styles.barFill} ${styles[bar.tone]}`}
          style={{ width: `${width}%` }}
        />
      )}
      {primary ? (
        <div className={styles.primaryContent}>
          <div
            className={`${styles.titleBlock} ${
              titleAccentPlacement === 'top' ? styles.titleBlockStacked : ''
            }`}
          >
            {titleAccent ? (
              <span
                className={styles.titleAccent}
                style={{ color: titleAccent.color }}
              >
                {titleAccent.label}
              </span>
            ) : null}
            <div className={styles.titleLine}>
              {showPrimaryLabel ? (
                <span className={styles.primaryLabel}>{bar.label}</span>
              ) : null}
              {showPrimaryTitle && title ? (
                <strong className={styles.title}>{title}</strong>
              ) : null}
            </div>
          </div>
          <strong className={styles.value}>{valueText}</strong>
        </div>
      ) : bar.reserved ? null : (
        <div className={styles.secondaryContent}>
          <span className={styles.secondaryLabel}>
            {bar.text ? `${bar.label} ${bar.text}` : bar.label}
          </span>
          <strong className={styles.secondaryValue}>{valueText}</strong>
        </div>
      )}
    </div>
  );
}

function StatusIcon({
  icon,
  onHoverDetail,
  onLeaveDetail,
}: WindowDetailTooltipHandlers & { icon: EntityStatusIcon }) {
  return (
    <button
      type="button"
      className={`${styles.iconButton} ${
        icon.cooldownRatio && icon.cooldownRatio > 0 ? styles.iconButtonDisabled : ''
      }`}
      aria-label={icon.label}
      style={{ borderColor: icon.borderColor }}
      onMouseEnter={(event) =>
        onHoverDetail?.(
          event,
          icon.tooltipTitle,
          icon.tooltipLines,
          icon.tooltipBorderColor,
        )
      }
      onMouseLeave={onLeaveDetail}
    >
      <span
        aria-hidden="true"
        className={styles.icon}
        style={iconMaskStyle(icon.icon, icon.tint)}
      />
      {icon.cooldownRatio && icon.cooldownRatio > 0 ? (
        <span
          className={styles.cooldownOverlay}
          style={{
            ['--cooldown-scale' as string]: `${icon.cooldownRatio}`,
            ['--cooldown-duration' as string]: `${Math.max(icon.remainingMs ?? 0, 1)}ms`,
          }}
        />
      ) : null}
    </button>
  );
}

function iconMaskStyle(icon: string, tint: string) {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    backgroundColor: tint,
    WebkitMask: mask,
    mask,
  };
}

function toneBorderColor(tone: EntityStatusBar['tone']) {
  switch (tone) {
    case 'cast':
      return 'rgba(250, 204, 21, 0.9)';
    case 'hp':
      return 'rgba(248, 113, 113, 0.9)';
    case 'mana':
    case 'thirst':
      return 'rgba(103, 232, 249, 0.9)';
    case 'xp':
      return 'rgba(167, 139, 250, 0.9)';
    case 'hunger':
      return 'rgba(251, 146, 60, 0.9)';
    default:
      return 'rgba(148, 163, 184, 0.9)';
  }
}

export type { EntityStatusBar, EntityStatusIcon, EntityStatusPanelProps };
