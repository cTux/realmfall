import { act } from 'react';
import { mountUi, setupUiTestEnvironment } from '../../uiTestHelpers';
import { VersionStatusWidget } from './VersionStatusWidget';

setupUiTestEnvironment();

describe('VersionStatusWidget', () => {
  it('shows the get new version action only when the remote version differs', async () => {
    const onRefresh = vi.fn();
    const onHoverDetail = vi.fn();
    const onLeaveDetail = vi.fn();
    const ui = await mountUi(
      <VersionStatusWidget
        currentVersion="1.0.0"
        remoteVersion="1.0.1"
        status="outdated"
        onRefresh={onRefresh}
        onHoverDetail={onHoverDetail}
        onLeaveDetail={onLeaveDetail}
      />,
    );

    const refreshButton = Array.from(ui.host.querySelectorAll('button')).find(
      (candidate) => candidate.textContent === 'Get new version',
    );

    expect(refreshButton).not.toBeUndefined();

    await act(async () => {
      refreshButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);

    await act(async () => {
      refreshButton?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
    });

    expect(onHoverDetail).toHaveBeenCalledWith(
      expect.any(Object),
      'Get new version',
      [
        { kind: 'text', text: 'Current: 1.0.0' },
        { kind: 'text', text: 'Remote: 1.0.1' },
      ],
      'rgba(248, 113, 113, 0.9)',
    );

    await act(async () => {
      refreshButton?.dispatchEvent(
        new MouseEvent('mouseout', { bubbles: true }),
      );
    });

    expect(onLeaveDetail).toHaveBeenCalledTimes(1);

    await ui.unmount();
  });
});
