import { act, type ReactNode } from 'react';
import { expect, vi } from 'vitest';
import { mountUi, settleUi } from '../../../uiTestHelpers';
import { DraggableWindow } from '../DraggableWindow';
import type { WindowPosition } from '../types';
import { ensureReactActEnvironment } from './utils/environment';
import {
  findFloatingWindows,
  findWindowByContentText,
  findWindowCloseButton,
  findWindowHeader,
  findWindowResizeHandle,
} from './utils/dom';
import type {
  DraggableWindowRenderConfig,
  WindowOnMoveMock,
} from './utils/types';

export class DraggableWindowTestkit {
  private mountedUi: Awaited<ReturnType<typeof mountUi>> | null = null;
  private originalInnerWidth = 0;
  private originalInnerHeight = 0;
  private originalRequestAnimationFrame:
    | typeof window.requestAnimationFrame
    | null = null;
  private originalCancelAnimationFrame:
    | typeof window.cancelAnimationFrame
    | null = null;
  private getBoundingClientRectSpy: ReturnType<typeof vi.spyOn> | null = null;

  constructor() {
    ensureReactActEnvironment();
    this.configureViewport();
  }

  readonly actions = {
    renderWindow: async (config: DraggableWindowRenderConfig) => {
      await this.mount(
        <DraggableWindow
          title={config.title}
          position={config.position}
          resizeBounds={config.resizeBounds}
          visible={config.visible}
          onMove={config.onMove}
        >
          {config.children ?? <div>Content</div>}
        </DraggableWindow>,
      );
    },
    renderWindows: async (configs: DraggableWindowRenderConfig[]) => {
      await this.mount(
        <>
          {configs.map((config, index) => (
            <DraggableWindow
              key={index}
              title={config.title}
              position={config.position}
              resizeBounds={config.resizeBounds}
              visible={config.visible}
              onMove={config.onMove}
            >
              {config.children ?? <div>Content</div>}
            </DraggableWindow>
          ))}
        </>,
      );
    },
    pointerDownWindowHeader: async (
      title: string,
      clientX: number,
      clientY: number,
    ) => {
      const handle = this.windowHeader(title);
      await this.dispatchMouseEvent(handle, 'pointerdown', {
        clientX,
        clientY,
      });
    },
    pointerDownResizeHandle: async (
      title: string,
      clientX: number,
      clientY: number,
    ) => {
      const handle = this.resizeHandle(title);
      await this.dispatchMouseEvent(handle, 'pointerdown', {
        clientX,
        clientY,
      });
    },
    pointerMove: async (clientX: number, clientY: number) => {
      await act(async () => {
        window.dispatchEvent(
          new MouseEvent('pointermove', { clientX, clientY, bubbles: true }),
        );
      });
      await settleUi();
    },
    pointerUp: async () => {
      await act(async () => {
        window.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
      });
      await settleUi();
    },
  };

  readonly expect = {
    windowCount: async (expected: number) => {
      expect(this.windows().length).toBe(expected);
    },
    closeButtonSmallWithIcon: async (title: string) => {
      const button = this.closeButton(title);
      expect(button?.getAttribute('data-size')).toBe('small');
      expect(button?.querySelector('[data-close-icon="true"]')).not.toBeNull();
    },
    onMoveCalledWith: async (
      onMove: WindowOnMoveMock,
      expected: WindowPosition,
    ) => {
      expect(onMove).toHaveBeenCalledWith(expected);
    },
    onMoveNotCalled: async (onMove: WindowOnMoveMock) => {
      expect(onMove).not.toHaveBeenCalled();
    },
    windowInteractingState: async (title: string, value: 'true' | 'false') => {
      expect(this.windowElement(title)?.dataset.windowInteracting).toBe(value);
    },
    headerPositionForTitle: async (title: string, x: string, y: string) => {
      const windowElement = this.windowElement(title);
      expect(windowElement?.style.getPropertyValue('--window-position-x')).toBe(
        x,
      );
      expect(windowElement?.style.getPropertyValue('--window-position-y')).toBe(
        y,
      );
    },
    zIndexHigherThan: async (frontTitle: string, backTitle: string) => {
      const frontWindow = this.windowElement(frontTitle);
      const backWindow = this.windowElement(backTitle);

      expect(Number(frontWindow?.style.zIndex)).toBeGreaterThan(
        Number(backWindow?.style.zIndex),
      );
    },
  };

  async restore() {
    try {
      if (this.mountedUi) {
        await this.mountedUi.unmount();
      }
    } finally {
      this.restoreViewport();
      this.mountedUi = null;
      vi.restoreAllMocks();
    }
  }

  private async mount(node: ReactNode) {
    if (this.mountedUi) {
      await this.mountedUi.render(node);
      return;
    }

    this.mountedUi = await mountUi(node);
  }

  private configureViewport() {
    const host = window;
    this.originalInnerWidth = host.innerWidth;
    this.originalInnerHeight = host.innerHeight;
    this.originalRequestAnimationFrame = window.requestAnimationFrame;
    this.originalCancelAnimationFrame = window.cancelAnimationFrame;

    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    };
    window.cancelAnimationFrame = () => undefined;

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 400,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 300,
    });

    this.getBoundingClientRectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(
        function mockGetBoundingClientRect(this: HTMLElement) {
          const left = Number(
            (
              this.style.getPropertyValue('--window-position-x') ||
              this.style.left
            ).replace('px', '') || 0,
          );
          const top = Number(
            (
              this.style.getPropertyValue('--window-position-y') ||
              this.style.top
            ).replace('px', '') || 0,
          );
          const width = Number(this.style.width.replace('px', '') || 320);
          const height = Number(this.style.height.replace('px', '') || 220);

          return {
            x: left,
            y: top,
            left,
            top,
            width,
            height,
            right: left + width,
            bottom: top + height,
            toJSON: () => undefined,
          } as DOMRect;
        },
      );
  }

  private restoreViewport() {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: this.originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: this.originalInnerHeight,
    });
    if (this.originalRequestAnimationFrame) {
      window.requestAnimationFrame = this.originalRequestAnimationFrame;
    }
    if (this.originalCancelAnimationFrame) {
      window.cancelAnimationFrame = this.originalCancelAnimationFrame;
    }
    this.getBoundingClientRectSpy?.mockRestore();
  }

  private host() {
    const host = this.mountedUi?.host;
    if (!host) {
      throw new Error('DraggableWindow testkit is not mounted.');
    }
    return host;
  }

  private windows() {
    return findFloatingWindows(this.host());
  }

  private windowElement(title: string) {
    return findWindowByContentText(this.host(), title);
  }

  private closeButton(title: string) {
    return findWindowCloseButton(this.windowElement(title));
  }

  private windowHeader(title: string) {
    return findWindowHeader(this.windowElement(title));
  }

  private resizeHandle(title: string) {
    return findWindowResizeHandle(this.windowElement(title));
  }

  private async dispatchMouseEvent(
    target: Element | null,
    type: 'pointerdown',
    options: { clientX: number; clientY: number },
  ) {
    if (!target) {
      return;
    }

    await act(async () => {
      target.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          clientX: options.clientX,
          clientY: options.clientY,
        }),
      );
    });
    await settleUi();
  }
}
