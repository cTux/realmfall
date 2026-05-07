import { act, type ReactElement } from 'react';
import { expect, vi } from 'vitest';
import { setWorldClockTime } from '../../../../app/App/worldClockStore';
import { mountUi, settleUi } from '../../../uiTestHelpers';
import { CombatWindowContent } from '../CombatWindowContent';
import {
  createDefaultCombat,
  createDefaultEnemies,
  createDefaultPlayerParty,
  WORLD_TIME_MS,
} from './utils/fixtures';
import { ensureReactActEnvironment } from './utils/environment';
import {
  findAbilityButtonByTitle,
  findEntityCardByTitle,
  findPrimaryBarByTitle,
} from './utils/selectors';
import type { CombatWindowRenderOverrides } from './utils/types';

export class CombatWindowContentTestkit {
  readonly mock = {
    onHoverDetail: vi.fn(),
    onLeaveDetail: vi.fn(),
  };

  private mountedUi: Awaited<ReturnType<typeof mountUi>> | null = null;

  constructor() {
    ensureReactActEnvironment();
    setWorldClockTime(0);
  }

  readonly actions = {
    render: async (overrides: CombatWindowRenderOverrides = {}) => {
      const worldTimeMs = overrides.worldTimeMs ?? WORLD_TIME_MS;
      const combat = overrides.combat ?? createDefaultCombat(worldTimeMs);
      const playerParty =
        overrides.playerParty ?? createDefaultPlayerParty(worldTimeMs);
      const enemies = overrides.enemies ?? createDefaultEnemies();
      const onHoverDetail = this.mock.onHoverDetail;
      const onLeaveDetail = this.mock.onLeaveDetail;

      await this.mount(
        <CombatWindowContent
          combat={combat}
          playerParty={playerParty}
          enemies={enemies}
          worldTimeMs={worldTimeMs}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />,
      );
    },
    hoverEntityBar: async (title: string) => {
      await this.dispatchMouseToBar(
        findPrimaryBarByTitle(this.host(), title),
        'mouseover',
      );
    },
    setWorldClockTime: (value: number) => {
      setWorldClockTime(value);
    },
  };

  readonly expect = {
    primaryDetailForBar: async (
      title: string,
      expected: {
        color: string;
        lines: Array<{
          kind: string;
          text?: string;
          tone?: string;
          label?: string;
          value?: string;
        }>;
      },
    ) => {
      const [, tooltipTitle, lines, color] = this.lastHoverCall();

      expect(tooltipTitle).toBe(title);
      expect(color).toBe(expected.color);
      expect(lines).toEqual(expect.arrayContaining(expected.lines));
    },
    abilityButtonDisabled: async (
      entityTitle: string,
      abilityLabel: string,
      { hasCastBar = true }: { hasCastBar?: boolean } = {},
    ) => {
      const abilityButton = this.findAbilityButton(entityTitle, abilityLabel);

      expect(abilityButton).not.toBeNull();
      expect(abilityButton?.className).toContain('iconButtonDisabled');
      expect(abilityButton?.getAttribute('aria-disabled')).toBe('true');
      expect(
        abilityButton?.querySelector('[class*="cooldownOverlay"]'),
      ).toBeNull();

      if (hasCastBar) {
        expect(this.host().querySelector('[class*="castBar"]')).toBeNull();
      }
    },
    abilityButtonEnabled: async (entityTitle: string, abilityLabel: string) => {
      const abilityButton = this.findAbilityButton(entityTitle, abilityLabel);

      expect(abilityButton).not.toBeNull();
      expect(abilityButton?.className).not.toContain('iconButtonDisabled');
      expect(abilityButton?.getAttribute('aria-disabled')).not.toBe('true');
    },
    barStackItemCount: async (entityTitle: string, expected: number) => {
      const entityCard = findEntityCardByTitle(this.host(), entityTitle);
      const barStack = entityCard?.querySelector(
        'div[class*="barStack"]',
      ) as HTMLDivElement | null;
      expect(barStack?.children.length).toBe(expected);
    },
    worldClockUsesLiveTime: async (title: string, abilityLabel: string) => {
      await this.expect.abilityButtonEnabled(title, abilityLabel);
    },
  };

  async restore() {
    try {
      if (this.mountedUi) {
        await this.mountedUi.unmount();
        this.mountedUi = null;
      }
    } finally {
      setWorldClockTime(0);
      vi.restoreAllMocks();
    }
  }

  private async mount(node: ReactElement) {
    if (!this.mountedUi) {
      this.mountedUi = await mountUi(node);
      return;
    }

    await this.mountedUi.render(node);
  }

  private lastHoverCall() {
    const calls = this.mock.onHoverDetail.mock.calls;
    const last = calls[calls.length - 1] as
      | [
          unknown,
          string,
          Array<{
            kind: string;
            text?: string;
            tone?: string;
            label?: string;
            value?: string;
          }>,
          string,
        ]
      | undefined;
    if (!last) {
      throw new Error('Expected hover detail callback to have been triggered.');
    }

    return last;
  }

  private host() {
    const host = this.mountedUi?.host;
    if (!host) {
      throw new Error('CombatWindowContent testkit is not mounted.');
    }
    return host;
  }

  private async dispatchMouseToBar(target: Element | null, type: 'mouseover') {
    if (!target) {
      return;
    }

    await act(async () => {
      target.dispatchEvent(new MouseEvent(type, { bubbles: true }));
    });
    await settleUi();
  }

  private findAbilityButton(entityTitle: string, abilityLabel: string) {
    return findAbilityButtonByTitle(this.host(), entityTitle, abilityLabel);
  }
}
