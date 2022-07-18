// tests/config.test.ts
// Tests for the configuration loader.

import { afterEach, describe, test, expect, vi } from 'vitest';
import { extend as createFetch } from 'got';

import { loadConfiguration } from '../source/utilities/config.js';
import { startServer } from '../source/utilities/server.js';

// The path to the fixtures for this test file.
const fixture = 'tests/__fixtures__/server/';
// The configuration from the fixture.
const config = await loadConfiguration(process.cwd(), fixture, {});
// A `fetch` instance to make requests to the server.
const fetch = createFetch({ throwHttpErrors: false });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('utilities/server', () => {
  // Make sure the server starts on the specified port.
  test('start server on specified port', async () => {
    const address = await startServer({ port: 3001 }, config, {});

    expect(address.local).toBe('http://localhost:3001');
    expect(address.network).toMatch(/^http:\/\/.*:3001$/);
    expect(address.previous).toBeUndefined();

    const response = await fetch(address.local!);
    expect(response.ok);
  });

  // Make sure the server starts on the specified port and host.
  test('start server on specified port and host', async () => {
    const address = await startServer({ port: 3002, host: '::1' }, config, {});

    expect(address.local).toBe('http://[::1]:3002');
    expect(address.network).toMatch(/^http:\/\/.*:3002$/);
    expect(address.previous).toBeUndefined();

    const response = await fetch(address.local!);
    expect(response.ok);
  });

  // Make sure the server starts on the specified port and host.
  test('start server on different port if port is already occupied', async () => {
    const address = await startServer({ port: 3002, host: '::1' }, config, {});

    expect(address.local).not.toBe('http://[::1]:3002');
    expect(address.network).not.toMatch(/^http:\/\/.*:3002$/);
    expect(address.previous).toBe(3002);

    const response = await fetch(address.local!);
    expect(response.ok);
  });
});
