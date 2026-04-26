import selfsigned from 'selfsigned';
import { shouldRotateLocalhostHttpsCertificate } from '../packages/client/scripts/localhost-https.mjs';

describe('localhost HTTPS certificate rotation', () => {
  it('keeps unexpired certificates and rotates expired or invalid ones', async () => {
    const { cert } = await selfsigned.generate(
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

    expect(shouldRotateLocalhostHttpsCertificate(cert)).toBe(false);
    expect(
      shouldRotateLocalhostHttpsCertificate(
        cert,
        new Date('2100-01-01T00:00:00.000Z'),
      ),
    ).toBe(true);
    expect(shouldRotateLocalhostHttpsCertificate('not a certificate')).toBe(
      true,
    );
  });
});
