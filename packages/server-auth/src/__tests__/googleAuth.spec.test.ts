import { GooglePlayerAuthTestkit } from './GooglePlayerAuthTestkit.js';

describe('createGooglePlayerAuth', () => {
  let testkit: GooglePlayerAuthTestkit;

  beforeEach(() => {
    testkit = new GooglePlayerAuthTestkit();
  });

  it('verifies Google player tokens against the configured audience', async () => {
    await testkit.expect.verifiesTokensAgainstConfiguredAudience();
  });

  it('maps the verified token payload into the player identity shape', async () => {
    await testkit.expect.mapsVerifiedPayloadToPlayerIdentity();
  });

  it('rejects verified token payloads without an email address', async () => {
    await testkit.expect.rejectsPayloadsWithoutEmail();
  });

  it('rejects verification when the Google client id is missing', async () => {
    await testkit.expect.rejectsVerificationWithoutGoogleClientId();
  });
});
