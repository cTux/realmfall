import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { X509Certificate } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import selfsigned from 'selfsigned';

const certDir = join(tmpdir(), 'realmfall-https');
const certPath = join(certDir, 'localhost-cert.pem');
const keyPath = join(certDir, 'localhost-key.pem');

export function shouldRotateLocalhostHttpsCertificate(
  certPem,
  now = new Date(),
) {
  try {
    const certificate = new X509Certificate(certPem);
    return Date.parse(certificate.validTo) <= now.getTime();
  } catch {
    return true;
  }
}

async function generateCertificate() {
  const { cert, private: privateKey } = await selfsigned.generate(
    [{ name: 'commonName', value: 'localhost' }],
    {
      algorithm: 'sha256',
      days: 30,
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

export async function ensureLocalhostHttpsCertificate() {
  if (
    !existsSync(certPath) ||
    !existsSync(keyPath) ||
    shouldRotateLocalhostHttpsCertificate(readFileSync(certPath))
  ) {
    await generateCertificate();
  }

  return {
    cert: readFileSync(certPath),
    certPath,
    key: readFileSync(keyPath),
    keyPath,
  };
}
