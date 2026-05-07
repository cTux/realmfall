import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { expect } from 'vitest';
import { mountUi } from '../../../uiTestHelpers';
import { t } from '../../../../i18n';
import { renderWindowHotkeyLabelText } from '../../../hotkeyLabels';
import { WINDOW_LABELS } from '../../../windowLabels';
import { HeroWindow } from '../HeroWindow';
import styles from '../styles.module.scss';
import type { HeroWindowProps } from '../types';
import { buildHeroWindowProps } from './utils/heroWindowFixtures';

export class HeroWindowTestkit {
  private mountedUi: {
    host: HTMLDivElement;
    render: (node: ReactNode) => Promise<void>;
    unmount: () => Promise<void>;
  } | null = null;

  readonly actions = {
    render: async (overrides: Partial<HeroWindowProps> = {}) => {
      await this.mount({ settle: true, ...overrides });
    },
    renderImmediately: async (overrides: Partial<HeroWindowProps> = {}) => {
      await this.mount({ settle: false, ...overrides });
    },
  };

  readonly expect = {
    loadingWindowShellVisible: async () => {
      const text = this.hostText();
      expect(text).toContain(renderWindowHotkeyLabelText(WINDOW_LABELS.hero));
      expect(
        this.query(`[aria-label="${t('ui.loading.window')}"]`),
      ).not.toBeNull();
    },
    statSheetSummaryVisible: async () => {
      expect(this.hostText()).toContain(t('ui.hero.statSheet.primary'));
      expect(this.hostText()).toContain(t('ui.hero.statSheet.secondary'));
      expect(this.hostText()).toContain('Bonus Experience');
      expect(this.hostText()).toContain('143%');
      expect(this.hostText()).toContain('Critical Strike Chance');
      expect(this.hostText()).toContain('75% (143% raw)');
      expect(this.hostText()).toContain('Attack Speed');
      expect(this.hostText()).toContain('25%');
      expect(this.hostText()).toContain('Suppress Debuff Chance');
      expect(this.hostText()).toContain(
        renderWindowHotkeyLabelText(WINDOW_LABELS.hero),
      );
      expect(this.hostText()).not.toContain('Hero infoHP');
    },
    resizableWindowShellAndScroller: async () => {
      const windowNode = this.query(`.${styles.window}`) as HTMLElement | null;
      const windowShell = this.query(
        'section[class*="floatingWindow"]',
      ) as HTMLElement | null;
      const statsScroller = this.query(
        `.${styles.stats}`,
      ) as HTMLElement | null;
      const resizeHandle = this.query(
        'div[class*="resizeHandle"]',
      ) as HTMLElement | null;

      expect(windowNode).not.toBeNull();
      expect(windowShell).not.toBeNull();
      expect(windowShell?.style.getPropertyValue('--window-base-width')).toBe(
        '320px',
      );
      expect(windowShell?.style.getPropertyValue('--window-base-height')).toBe(
        '260px',
      );
      expect(resizeHandle).not.toBeNull();
      expect(statsScroller).not.toBeNull();
    },
    summaryIsOutsideScroller: async () => {
      const summary = this.query(`.${styles.summary}`) as HTMLElement | null;
      const statsScroller = this.query(
        `.${styles.stats}`,
      ) as HTMLElement | null;

      expect(summary).not.toBeNull();
      expect(statsScroller).not.toBeNull();
      expect(statsScroller?.contains(summary as Node)).toBe(false);
      expect(statsScroller?.textContent).toContain(
        t('ui.hero.statSheet.primary'),
      );
      expect(statsScroller?.textContent).toContain(
        t('ui.hero.statSheet.secondary'),
      );
    },
  };

  constructor() {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  }

  async restore() {
    if (!this.mountedUi) {
      return;
    }

    await this.mountedUi.unmount();
    this.mountedUi = null;
  }

  private async mount({
    settle,
    ...props
  }: { settle: boolean } & Partial<HeroWindowProps>) {
    await this.restore();

    const mergedProps = buildHeroWindowProps(props);

    if (settle) {
      this.mountedUi = await mountUi(<HeroWindow {...mergedProps} />);
      return;
    }

    const host = document.createElement('div');
    const root = createRoot(host);
    document.body.appendChild(host);
    await act(async () => {
      root.render(<HeroWindow {...mergedProps} />);
    });
    this.mountedUi = {
      host,
      render: async (nextNode: ReactNode) => {
        await act(async () => {
          root.render(nextNode);
        });
      },
      unmount: async () => {
        await act(async () => {
          root.unmount();
        });
        host.remove();
      },
    };
  }

  private query(selector: string) {
    return this.host.querySelector(selector);
  }

  private get host() {
    if (!this.mountedUi) {
      throw new Error('Expected mounted HeroWindow.');
    }
    return this.mountedUi.host;
  }

  private hostText() {
    return this.host.textContent ?? '';
  }
}
