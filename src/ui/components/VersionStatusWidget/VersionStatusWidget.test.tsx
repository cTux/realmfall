import { act } from 'react';
import { mountUi, setupUiTestEnvironment } from '../../uiTestHelpers';
import { VersionStatusWidget } from './VersionStatusWidget';

setupUiTestEnvironment();

describe('VersionStatusWidget', () => {
  it('shows the get new version action only when the remote version differs', async () => {
    const onRefresh = vi.fn();
    const ui = await mountUi(
      <VersionStatusWidget
        currentVersion="1.0.0"
        remoteVersion="1.0.1"
        status="outdated"
        onRefresh={onRefresh}
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

    await ui.render(
      <VersionStatusWidget
        currentVersion="1.0.0"
        remoteVersion="1.0.0"
        status="current"
        onRefresh={onRefresh}
      />,
    );

    expect(ui.host.querySelector('button')).toBeNull();

    await ui.unmount();
  });
});
