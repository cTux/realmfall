import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer, resolveHttpsServerOptions } from './app.js';

describe('buildServer', () => {
  let server: FastifyInstance;

  beforeEach(() => {
    server = buildServer({
      gameVersion: '0.2.470+abcdef123456',
    });
  });

  afterEach(async () => {
    await server.close();
  });

  it('returns the configured game version from GET /api/version', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/version',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      version: '0.2.470+abcdef123456',
    });
  });

  it('reads HTTPS certificate buffers from certificate file paths', () => {
    const fixtureDirectory = mkdtempSync(
      join(tmpdir(), 'realmfall-server-https-test-'),
    );
    const certPath = join(fixtureDirectory, 'cert.pem');
    const keyPath = join(fixtureDirectory, 'key.pem');

    writeFileSync(certPath, 'certificate-pem');
    writeFileSync(keyPath, 'private-key-pem');

    expect(resolveHttpsServerOptions({ certPath, keyPath })).toEqual({
      cert: Buffer.from('certificate-pem'),
      key: Buffer.from('private-key-pem'),
    });
  });
});
