import { X509Certificate } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import selfsigned from 'selfsigned';

export async function ensureLocalhostHttpsCertificate() {
  const certDir = join(tmpdir(), 'realmfall-https');
  const certPath = join(certDir, 'localhost-cert.pem');
  const keyPath = join(certDir, 'localhost-key.pem');

  const shouldRotateCertificate = (() => {
    if (!existsSync(certPath) || !existsSync(keyPath)) {
      return true;
    }

    try {
      const certificate = new X509Certificate(readFileSync(certPath));
      return Date.parse(certificate.validTo) <= Date.now();
    } catch {
      return true;
    }
  })();

  if (shouldRotateCertificate) {
    const { cert, private: privateKey } = await selfsigned.generate(
      [{ name: 'commonName', value: 'localhost' }],
      {
        algorithm: 'sha256',
        keySize: 2048,
        extensions: [
          {
            name: 'subjectAltName',
            altNames: [
              { type: 2, value: 'localhost' },
              { type: 7, ip: '127.0.0.1' },
              { type: 7, ip: '::1' },
            ],
          },
        ],
      },
    );

    mkdirSync(certDir, { recursive: true });
    writeFileSync(certPath, cert);
    writeFileSync(keyPath, privateKey);
  }

  return {
    cert: readFileSync(certPath),
    key: readFileSync(keyPath),
  };
}
