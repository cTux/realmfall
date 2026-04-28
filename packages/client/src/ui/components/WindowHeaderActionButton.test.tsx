import { act } from 'react';
import { WindowHeaderActionButton } from './WindowHeaderActionButton';
import { mountUi, setupUiTestEnvironment } from '../uiTestHelpers';

setupUiTestEnvironment();

describe('WindowHeaderActionButton', () => {
  it('keeps tooltip hover active while blocking clicks for disabled actions', async () => {
    const onClick = vi.fn();
    const onHoverDetail = vi.fn();
    const onLeaveDetail = vi.fn();
    const ui = await mountUi(
      <WindowHeaderActionButton
        className="headerButton"
        disabled
        tooltipTitle="Cl(a)im"
        tooltipLines={[
          {
            kind: 'text',
            text: 'Claim this hex by spending 1 Cloth and 1 Sticks for a banner.',
          },
        ]}
        onClick={onClick}
        onHoverDetail={onHoverDetail}
        onLeaveDetail={onLeaveDetail}
      >
        Cl(a)im
      </WindowHeaderActionButton>,
    );

    const button = ui.host.querySelector('button') as HTMLButtonElement | null;
    expect(button?.getAttribute('data-size')).toBe('small');
    expect(button?.getAttribute('aria-disabled')).toBe('true');

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });

    expect(onHoverDetail).toHaveBeenCalledTimes(1);

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onClick).not.toHaveBeenCalled();

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    });

    expect(onLeaveDetail).toHaveBeenCalledTimes(1);

    await ui.unmount();
  });
});
