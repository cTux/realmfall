import type {
  FocusEvent as ReactFocusEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  RefObject,
} from 'react';
import { Button, WindowCloseIcon } from '@realmfall/ui';
import { useUiAudio } from '../../../app/audio/UiAudioContext';
import type { WindowPosition } from '../../../app/constants';
import { t } from '../../../i18n';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';
import type { WindowResizeBounds } from './types';
import styles from './styles.module.scss';

interface DraggableWindowFrameProps extends WindowDetailTooltipHandlers {
  bodyClassName?: string;
  children: ReactNode;
  className?: string;
  closeButtonTooltip?: string;
  emphasis: 'active' | 'hovered' | 'idle';
  headerActions?: ReactNode;
  isEntered: boolean;
  onBlurCapture: (event: ReactFocusEvent<HTMLElement>) => void;
  onClose: () => void;
  onHeaderPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onWindowActivate: () => void;
  onWindowHoverEnter: () => void;
  onWindowHoverLeave: () => void;
  position: WindowPosition;
  resizeBounds?: WindowResizeBounds;
  showCloseButton: boolean;
  title: ReactNode;
  titleClassName?: string;
  windowRef: RefObject<HTMLElement | null>;
}

export function DraggableWindowFrame({
  bodyClassName,
  children,
  className,
  closeButtonTooltip,
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
}: DraggableWindowFrameProps) {
  const audio = useUiAudio();

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
        <h2 className={`${styles.windowTitle} ${titleClassName ?? ''}`.trim()}>
          {title}
        </h2>
        <div className={styles.windowHeaderActions}>
          {headerActions ? (
            <div
              className={styles.headerActions}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {headerActions}
            </div>
          ) : null}
          {showCloseButton ? (
            <Button
              size="small"
              unstyled
              type="button"
              className={styles.headerButton}
              data-ui-audio-click="off"
              aria-label={t('ui.common.close')}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.currentTarget.blur();
                audio.swoosh();
                onClose();
              }}
              onMouseEnter={(event) =>
                onHoverDetail?.(
                  event,
                  t('ui.common.close'),
                  [
                    {
                      kind: 'text',
                      text: closeButtonTooltip ?? t('ui.tooltip.window.close'),
                    },
                  ],
                  'rgba(248, 113, 113, 0.9)',
                )
              }
              onMouseLeave={onLeaveDetail}
            >
              <WindowCloseIcon />
            </Button>
          ) : null}
        </div>
      </div>
      <div className={`${styles.windowBody} ${bodyClassName ?? ''}`.trim()}>
        {children}
      </div>
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
