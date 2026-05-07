import { createServerListenUrl, createServerRuntimeConfig } from './runtime.js';

describe('server runtime config', () => {
  it('defaults to localhost on port 3001', () => {
    expect(createServerRuntimeConfig({})).toEqual({
      host: 'localhost',
      port: 3001,
    });
  });

  it('uses HOST and PORT overrides when provided', () => {
    expect(
      createServerRuntimeConfig({
        HOST: '0.0.0.0',
        PORT: '4100',
      }),
    ).toEqual({
      host: '0.0.0.0',
      port: 4100,
    });
  });

  it('formats listen URLs for both HTTP and HTTPS entries', () => {
    expect(
      createServerListenUrl({
        host: 'localhost',
        port: 3001,
      }),
    ).toBe('http://localhost:3001');
    expect(
      createServerListenUrl({
        host: 'localhost',
        https: true,
        port: 3001,
      }),
    ).toBe('https://localhost:3001');
  });
});
