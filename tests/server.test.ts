// tests/server.test.ts
// Tests for the server creating function.

import { afterEach, describe, test, expect, vi } from 'vitest';
import { extend as createFetch } from 'got';

import { loadConfiguration } from '../source/utilities/config.js';
import { startServer } from '../source/utilities/server.js';
import { logger } from '../source/utilities/logger.js';

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

  // Make sure the server logs requests by default.
  test('log requests to the server by default', async () => {
    const consoleSpy = vi.spyOn(logger, 'http');
    const address = await startServer({ port: 3003, host: '::1' }, config, {});

    const response = await fetch(address.local!);
    expect(response.ok);

    expect(consoleSpy).toBeCalledTimes(2);

    const requestLog = consoleSpy.mock.calls[0].join(' ');
    const responseLog = consoleSpy.mock.calls[1].join(' ');

    const time = new Date();
    const formattedTime = `${time.toLocaleDateString()} ${time.toLocaleTimeString()}`;
    const ip = '::1';
    const requestString = 'GET /';
    const status = 200;

    expect(requestLog).toMatch(
      new RegExp(`${formattedTime}.*${ip}.*${requestString}`),
    );
    expect(responseLog).toMatch(
      new RegExp(
        `${formattedTime}.*${ip}.*Returned ${status} in [0-9][0-9]? ms`,
      ),
    );
  });

  // Make sure the server logs requests by default.
  test('log requests to the server by default', async () => {
    const consoleSpy = vi.spyOn(logger, 'http');
    const address = await startServer({ port: 3004 }, config, {
      '--no-request-logging': true,
    });

    const response = await fetch(address.local!);
    expect(response.ok);

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
