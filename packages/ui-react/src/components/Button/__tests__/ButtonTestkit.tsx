import type { ReactNode } from 'react';
import { mountUi } from '../../../test/uiTestHelpers';
import { Button } from '../Button';

export class ButtonTestkit {
  readonly actions = {
    renderCompactAction: async () => {
      await this.render(<Button size="small">Compact action</Button>);
    },
    renderDestructiveAction: async () => {
      await this.render(<Button tone="danger">Delete save</Button>);
    },
  };

  readonly expect = {
    buttonUsesSize: async (size: 'small') => {
      expect(this.button()?.getAttribute('data-size')).toBe(size);
    },
    buttonUsesTone: async (tone: 'danger') => {
      expect(this.button()?.getAttribute('data-tone')).toBe(tone);
    },
  };

  private mountedUi: Awaited<ReturnType<typeof mountUi>> | null = null;

  async restore() {
    if (this.mountedUi) {
      await this.mountedUi.unmount();
      this.mountedUi = null;
    }
  }

  private button() {
    return this.mountedUi?.host.querySelector(
      'button',
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
