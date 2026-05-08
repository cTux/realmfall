import type { CSSProperties, ReactNode } from 'react';
import { mountUi } from '../../../test/uiTestHelpers';
import { Window } from '../Window';

export class WindowTestkit {
  readonly actions = {
    renderWithOpacityVariable: async () => {
      await this.render(
        <div style={{ '--app-window-opacity': '0.35' } as CSSProperties}>
          <Window
            title="Window"
            position={{ x: 24, y: 32, width: 560, height: 567 }}
            onMove={() => {}}
            resizeBounds={{ minWidth: 280, minHeight: 180 }}
          >
            Body
          </Window>
        </div>,
      );
    },
    renderWithTitleCloseButton: async () => {
      await this.render(
        <Window title="Window" position={{ x: 24, y: 32 }} onMove={() => {}}>
          Body
        </Window>,
      );
    },
  };

  readonly expect = {
    closeButtonUsesSharedSmallSize: async () => {
      const closeButton = this.closeButton();
      const closeIcon = closeButton?.querySelector(
        '[data-close-icon="true"]',
      ) as HTMLSpanElement | null;

      expect(closeButton?.getAttribute('data-size')).toBe('small');
      expect(closeButton?.textContent?.trim()).toBe('');
      expect(closeIcon).not.toBeNull();
    },
    windowUsesAppOpacityVariable: async () => {
      const windowElement = this.windowElement();
      const windowSurface = this.windowSurface();
      const resizeHandle = this.resizeHandle();

      expect(windowElement).not.toBeNull();
      expect(windowSurface).not.toBeNull();
      expect(resizeHandle).not.toBeNull();
      expect(windowElement?.style.opacity).toBe(
        'var(--window-opacity, var(--app-window-opacity, 1))',
      );
      expect(windowElement?.style.getPropertyValue('--window-base-width')).toBe(
        '560px',
      );
      expect(
        windowElement?.style.getPropertyValue('--window-base-height'),
      ).toBe('567px');
      expect(getComputedStyle(windowElement!).pointerEvents).toBe('auto');
      expect(windowSurface?.style.width).toBe('var(--window-base-width)');
      expect(windowSurface?.style.height).toBe('var(--window-base-height)');
      expect(resizeHandle?.parentElement).toBe(windowSurface);
    },
  };

  private mountedUi: Awaited<ReturnType<typeof mountUi>> | null = null;

  async restore() {
    if (this.mountedUi) {
      await this.mountedUi.unmount();
      this.mountedUi = null;
    }
  }

  private closeButton() {
    return this.mountedUi?.host.querySelector(
      'button[aria-label="Close"]',
    ) as HTMLButtonElement | null;
  }

  private async render(node: ReactNode) {
    if (this.mountedUi) {
      await this.mountedUi.render(node);
      return;
    }

    this.mountedUi = await mountUi(node);
  }

  private resizeHandle() {
    return this.mountedUi?.host.querySelector(
      'div[class*="resizeHandle"]',
    ) as HTMLDivElement | null;
  }

  private windowElement() {
    return this.mountedUi?.host.querySelector(
      'section[class*="floatingWindow"]',
    ) as HTMLElement | null;
  }

  private windowSurface() {
    return this.mountedUi?.host.querySelector(
      'div[class*="windowSurface"]',
    ) as HTMLDivElement | null;
  }
}
