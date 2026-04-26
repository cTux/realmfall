import {
  createSecurityHeaders,
  DEV_CONTENT_SECURITY_POLICY,
  RESPONSE_CONTENT_SECURITY_POLICY,
} from '../../packages/client/vite.security';

describe('Vite security headers', () => {
  it('keeps isolation headers enabled for dev and preview responses', () => {
    const serverHeaders = createSecurityHeaders(DEV_CONTENT_SECURITY_POLICY);
    const previewHeaders = createSecurityHeaders(
      RESPONSE_CONTENT_SECURITY_POLICY,
    );

    expect(serverHeaders['Cross-Origin-Opener-Policy']).toBe('same-origin');
    expect(serverHeaders['Cross-Origin-Resource-Policy']).toBe('same-origin');
    expect(previewHeaders['Cross-Origin-Opener-Policy']).toBe('same-origin');
    expect(previewHeaders['Cross-Origin-Resource-Policy']).toBe('same-origin');
  });

  it('narrows style CSP without dropping runtime style attributes', () => {
    const serverCsp = DEV_CONTENT_SECURITY_POLICY;
    const previewCsp = RESPONSE_CONTENT_SECURITY_POLICY;

    expect(serverCsp).toContain("style-src 'self'");
    expect(serverCsp).toContain("style-src-elem 'self' 'unsafe-inline'");
    expect(serverCsp).toContain("style-src-attr 'unsafe-inline'");
    expect(previewCsp).toContain("style-src 'self'");
    expect(previewCsp).toContain("style-src-elem 'self'");
    expect(previewCsp).toContain("style-src-attr 'unsafe-inline'");
    expect(previewCsp).not.toContain("style-src 'self' 'unsafe-inline'");
  });
});
