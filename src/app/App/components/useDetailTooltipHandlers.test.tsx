import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useDetailTooltipHandlers } from './useDetailTooltipHandlers';

type DetailTooltipHandlers = ReturnType<typeof useDetailTooltipHandlers>;

describe('useDetailTooltipHandlers', () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('keeps handler wrappers stable across unrelated rerenders', async () => {
    const onShowTooltip = vi.fn();
    const onCloseTooltip = vi.fn();
    const observedHandlers: DetailTooltipHandlers[] = [];

    function Harness({
      tick,
      onShow,
    }: {
      tick: number;
      onShow: typeof onShowTooltip;
    }) {
      void tick;
      observedHandlers.push(
        useDetailTooltipHandlers({
          onShowTooltip: onShow,
          onCloseTooltip,
        }),
      );
      return null;
    }

    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(<Harness tick={0} onShow={onShowTooltip} />);
    });
    await act(async () => {
      root.render(<Harness tick={1} onShow={onShowTooltip} />);
    });

    expect(observedHandlers[1]).toBe(observedHandlers[0]);

    const nextOnShowTooltip = vi.fn();
    await act(async () => {
      root.render(<Harness tick={2} onShow={nextOnShowTooltip} />);
    });

    expect(observedHandlers[2]).not.toBe(observedHandlers[1]);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
