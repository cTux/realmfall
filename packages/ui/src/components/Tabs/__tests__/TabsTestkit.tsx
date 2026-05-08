import { act, type ReactNode } from 'react';
import * as ButtonModule from '../../Button/Button';
import buttonStyles from '../../Button/styles.module.scss';
import { mountUi, settleUi } from '../../../test/uiTestHelpers';
import { Tabs } from '../Tabs';
import styles from '../styles.module.scss';

export class TabsTestkit {
  readonly mock = {
    buttonRenderSpy: vi.spyOn(ButtonModule, 'Button'),
    onChange: vi.fn(),
  };

  readonly actions = {
    clickAudioTab: async () => {
      await act(async () => {
        this.audioTab()?.click();
      });
      await settleUi();
    },
    render: async () => {
      await this.render(
        <Tabs
          activeTabId="graphics"
          tabs={[
            { id: 'graphics', label: 'Graphics' },
            { id: 'audio', label: 'Audio' },
          ]}
          onChange={this.mock.onChange}
        />,
      );
    },
  };

  readonly expect = {
    audioTabSelectionForwarded: async () => {
      expect(this.mock.onChange).toHaveBeenCalledWith('audio');
    },
    audioTabUsesSharedButtonSurface: async () => {
      const button = this.audioTab();

      expect(button?.id).toBe('audio-tab');
      expect(button?.tabIndex).toBe(-1);
      expect(button?.classList.contains(styles.tab)).toBe(true);
      expect(button?.classList.contains(buttonStyles.button)).toBe(false);
    },
    graphicsTabUsesSharedButtonSurface: async () => {
      const [firstButtonProps] = this.mock.buttonRenderSpy.mock.calls[0] ?? [];
      const button = this.graphicsTab();

      expect(this.mock.buttonRenderSpy).toHaveBeenCalledTimes(2);
      expect(firstButtonProps?.unstyled).toBe(true);
      expect(firstButtonProps?.className).toBe(styles.tab);
      expect(button?.id).toBe('graphics-tab');
      expect(button?.tabIndex).toBe(0);
      expect(button?.classList.contains(styles.tab)).toBe(true);
      expect(button?.classList.contains(buttonStyles.button)).toBe(false);
    },
  };

  private mountedUi: Awaited<ReturnType<typeof mountUi>> | null = null;

  async restore() {
    if (this.mountedUi) {
      await this.mountedUi.unmount();
      this.mountedUi = null;
    }
    vi.restoreAllMocks();
  }

  private audioTab() {
    return this.mountedUi?.host.querySelector(
      'button[aria-selected="false"]',
    ) as HTMLButtonElement | null;
  }

  private graphicsTab() {
    return this.mountedUi?.host.querySelector(
      'button[aria-selected="true"]',
    ) as HTMLButtonElement | null;
  }

  private async render(node: ReactNode) {
    if (this.mountedUi) {
      await this.mountedUi.render(node);
      return;
    }

    this.mountedUi = await mountUi(node);
  }
}
