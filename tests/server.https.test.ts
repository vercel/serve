// tests/server.https.test.ts
// Tests for the serve with HTTPS.

import { afterEach, describe, test, expect, vi } from 'vitest';
import { extend as createFetch } from 'got';

import { loadConfiguration } from '../source/utilities/config.js';
import { startServer } from '../source/utilities/server.js';

// The path to the fixtures for this test file.
const fixture = 'tests/__fixtures__/server/';
// The configuration from the fixture.
const config = await loadConfiguration(process.cwd(), fixture, {});
// A `fetch` instance to make requests to the server.
const fetch = createFetch({
  https: { rejectUnauthorized: false },
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('utilities/server', () => {
  test('start server with SSL when PFX certificate is supplied', async () => {
    const address = await startServer({ port: 5001 }, config, {
      ['--ssl-cert']: 'tests/__fixtures__/server/cert.pfx',
    });

    expect(address.local).toBe('https://localhost:5001');
    expect(address.network).toMatch(/^https:\/\/.*:5001$/);
    expect(address.previous).toBeUndefined();

    const response = await fetch(address.local!);

    expect(response.ok);
  });

  test('start server with SSL when PFX certificate and password is supplied', async () => {
    const address = await startServer({ port: 5002 }, config, {
      ['--ssl-cert']: 'tests/__fixtures__/server/certWithPass.pfx',
      ['--ssl-pass']: 'tests/__fixtures__/server/certPass',
    });

    expect(address.local).toBe('https://localhost:5002');
    expect(address.network).toMatch(/^https:\/\/.*:5002$/);
    expect(address.previous).toBeUndefined();

    const response = await fetch(address.local!);

    expect(response.ok);
  });

  test('start server with SSL when PFX certificate is supplied and password is missing', async () => {
    await expect(() =>
      startServer({ port: 5003 }, config, {
        ['--ssl-cert']: 'tests/__fixtures__/server/certWithPass.pfx',
      }),
    ).rejects.toThrowError('failure');
  });

  test('start server with SSL when PFX certificate is supplied and password is invalid', async () => {
    await expect(() =>
      startServer({ port: 5003 }, config, {
        ['--ssl-cert']: 'tests/__fixtures__/server/certWithPass.pfx',
        ['--ssl-pass']: 'tests/__fixtures__/server/certWithPass.pfx',
      }),
    ).rejects.toThrowError('failure');
  });

  test('start server with SSL when PEM certificate, key and password is supplied', async () => {
    const address = await startServer({ port: 5004 }, config, {
      ['--ssl-cert']: 'tests/__fixtures__/server/certWithPass.pem',
      ['--ssl-key']: 'tests/__fixtures__/server/certWithPass.key',
      ['--ssl-pass']: 'tests/__fixtures__/server/certPass',
    });

    expect(address.local).toBe('https://localhost:5004');
    expect(address.network).toMatch(/^https:\/\/.*:5004$/);
    expect(address.previous).toBeUndefined();

    const response = await fetch(address.local!);

    expect(response.ok);
  });

  test('start server with SSL when PEM certificate, key is supplied and no password is supplied', async () => {
    const address = await startServer({ port: 5005 }, config, {
      ['--ssl-cert']: 'tests/__fixtures__/server/cert.pem',
      ['--ssl-key']: 'tests/__fixtures__/server/cert.key',
    });

    expect(address.local).toBe('https://localhost:5005');
    expect(address.network).toMatch(/^https:\/\/.*:5005$/);
    expect(address.previous).toBeUndefined();

    const response = await fetch(address.local!);

    expect(response.ok);
  });

  test('start server without SSL when PEM certificate is supplied and key is missing', async () => {
    const address = await startServer({ port: 5006 }, config, {
      ['--ssl-cert']: 'tests/__fixtures__/server/cert.pem',
    });

    expect(address.local).toBe('http://localhost:5006');
    expect(address.network).toMatch(/^http:\/\/.*:5006$/);
    expect(address.previous).toBeUndefined();

    const response = await fetch(address.local!);

    expect(response.ok);
  });
});
