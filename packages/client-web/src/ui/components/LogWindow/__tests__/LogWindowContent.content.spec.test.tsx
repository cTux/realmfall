import { LogWindowContentTestkit } from './LogWindowContentTestkit';
import { createSystemLog, longLogs } from './utils/fixtures';

describe('LogWindowContent content', () => {
  let testkit: LogWindowContentTestkit;

  beforeEach(() => {
    testkit = new LogWindowContentTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('renders the newest log entry immediately', async () => {
    await testkit.actions.render([
      createSystemLog({ id: 'log-1', turn: 1, text: 'Hunt' }),
    ]);

    await testkit.expect.hasText('Hunt');
    await testkit.expect.noCursor();
  });

  it('virtualizes long log histories and reveals later entries on scroll', async () => {
    await testkit.actions.render(longLogs(80));
    await testkit.expect.hasVirtualizedList();
    await testkit.expect.hasText('Event #001');
    await testkit.expect.missingText('Event #080');

    await testkit.actions.scrollToBottom();
    await testkit.expect.hasText('Event #080');
    await testkit.expect.missingText('Event #001');
  });
});
