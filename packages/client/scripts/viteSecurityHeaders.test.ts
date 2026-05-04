import { readFileSync } from 'node:fs';
import {
  DEV_CONTENT_SECURITY_POLICY,
  RESPONSE_CONTENT_SECURITY_POLICY,
} from '../vite.security';

describe('client security headers', () => {
  it('allows runtime audio media sources in dev and preview CSPs', () => {
    expect(DEV_CONTENT_SECURITY_POLICY).toContain("default-src 'self'");
    expect(DEV_CONTENT_SECURITY_POLICY).toContain(
      "media-src 'self' data: blob:",
    );
    expect(RESPONSE_CONTENT_SECURITY_POLICY).toContain("default-src 'self'");
    expect(RESPONSE_CONTENT_SECURITY_POLICY).toContain(
      "media-src 'self' data: blob:",
    );
  });

  it('keeps static serving CSP aligned for runtime audio media sources', () => {
    const serveJson = JSON.parse(
      readFileSync(new URL('../serve.json', import.meta.url), 'utf8'),
    ) as {
      headers: Array<{
        headers?: Array<{ key: string; value: string }>;
      }>;
    };

    const contentSecurityPolicyHeader = serveJson.headers
      .flatMap((headerGroup) => headerGroup.headers ?? [])
      .find((header) => header.key === 'Content-Security-Policy');

    expect(contentSecurityPolicyHeader?.value).toContain(
      "media-src 'self' data: blob:",
    );
  });
});
