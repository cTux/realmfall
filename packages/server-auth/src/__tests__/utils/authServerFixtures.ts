import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function createHttpsFixture() {
  const fixtureDirectory = mkdtempSync(
    join(tmpdir(), 'realmfall-server-auth-https-test-'),
  );
  const certPath = join(fixtureDirectory, 'cert.pem');
  const keyPath = join(fixtureDirectory, 'key.pem');
  const cert = 'certificate-pem';
  const key = 'private-key-pem';

  writeFileSync(certPath, cert);
  writeFileSync(keyPath, key);

  return {
    cert,
    certPath,
    key,
    keyPath,
  };
}
