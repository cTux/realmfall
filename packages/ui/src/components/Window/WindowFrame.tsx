import type {
  FocusEvent as ReactFocusEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from 'react';
import { Button } from '../Button/Button';
import type { WindowProps, WindowTooltipLine } from './types';
import styles from './styles.module.scss';

interface WindowFrameProps extends Omit<WindowProps, 'onClose' | 'onMove'> {
  onClose: () => void;
  onBlurCapture: (event: ReactFocusEvent<HTMLElement>) => void;
  onHeaderPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onWindowActivate: () => void;
  onWindowHoverEnter: () => void;
  onWindowHoverLeave: () => void;
  isEntered: boolean;
  emphasis: 'active' | 'hovered' | 'idle';
  windowRef: RefObject<HTMLElement | null>;
}

export function WindowFrame({
  bodyClassName,
  children,
  className,
  closeButtonAriaLabel,
  closeButtonContent,
  closeButtonTooltip,
  closeButtonTooltipColor,
  emphasis,
  headerActions,
  isEntered,
  onBlurCapture,
  onClose,
  onHeaderPointerDown,
  onHoverDetail,
  onLeaveDetail,
  onResizePointerDown,
  onWindowActivate,
  onWindowHoverEnter,
  onWindowHoverLeave,
  position,
  resizeBounds,
  showCloseButton,
  title,
  titleClassName,
  windowRef,
}: WindowFrameProps) {
  const tooltipLabel = closeButtonAriaLabel ?? closeButtonTooltip ?? 'Close';
  const tooltipLines: WindowTooltipLine[] = [
    {
      kind: 'text',
      text: closeButtonTooltip ?? tooltipLabel,
    },
  ];
  const closeButtonColor =
    closeButtonTooltipColor ?? 'rgba(248, 113, 113, 0.9)';
  const canShowCloseButton = showCloseButton !== false;
  const resolvedCloseButtonContent = closeButtonContent ?? (
    <span
      className={styles.closeIcon}
      data-close-icon="true"
      aria-hidden="true"
    />
  );
  const normalizedBodyClassName = `${styles.windowBody} ${
    bodyClassName ?? ''
  }`.trim();
  const normalizedTitleClassName = `${styles.windowTitle} ${
    titleClassName ?? ''
  }`.trim();

  return (
    <section
      ref={windowRef}
      className={`${styles.floatingWindow} ${className ?? ''}`.trim()}
      data-window-emphasis={emphasis}
      data-window-visible={isEntered}
      tabIndex={-1}
      style={{
        left: position.x,
        top: position.y,
        width: position.width === undefined ? undefined : `${position.width}px`,
        height:
          position.height === undefined ? undefined : `${position.height}px`,
      }}
      onPointerEnter={onWindowHoverEnter}
      onPointerLeave={onWindowHoverLeave}
      onPointerDown={onWindowActivate}
      onFocusCapture={onWindowActivate}
      onBlurCapture={onBlurCapture}
    >
      <div className={styles.windowHeader} onPointerDown={onHeaderPointerDown}>
        <h2 className={normalizedTitleClassName}>{title}</h2>
        <div className={styles.windowHeaderActions}>
          {headerActions ? (
            <div
              className={styles.headerActions}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {headerActions}
            </div>
          ) : null}
          {canShowCloseButton ? (
            <Button
              type="button"
              size="small"
              unstyled
              className={styles.headerButton}
              data-ui-audio-click="off"
              aria-label={tooltipLabel}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.currentTarget.blur();
                onClose();
              }}
              onMouseEnter={(event) =>
                onHoverDetail?.(
                  event,
                  tooltipLabel,
                  tooltipLines,
                  closeButtonColor,
                )
              }
              onMouseLeave={onLeaveDetail}
            >
              {resolvedCloseButtonContent}
            </Button>
          ) : null}
        </div>
      </div>
      <div className={normalizedBodyClassName}>{children}</div>
      {resizeBounds ? (
        <div
          className={styles.resizeHandle}
          onPointerDown={onResizePointerDown}
          aria-hidden="true"
        />
      ) : null}
    </section>
  );
}
