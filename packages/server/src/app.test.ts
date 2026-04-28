import { afterEach, beforeEach, expect } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from './app.js';

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
});
