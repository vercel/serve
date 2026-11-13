// tests/server.test.ts
// Tests for the server creating function.

import { Server } from 'node:net';
import { afterEach, describe, test, expect, vi } from 'vitest';
import { extend as createFetch } from 'got';

import { loadConfiguration } from '../source/utilities/config.js';
import { startServer } from '../source/utilities/server.js';
import { logger } from '../source/utilities/logger.js';
import * as httpUtilities from '../source/utilities/http.js';

// The path to the fixtures for this test file.
const fixture = 'tests/__fixtures__/server/';
// The configuration from the fixture.
const config = await loadConfiguration(process.cwd(), fixture, {});
// A `fetch` instance to make requests to the server.
const fetch = createFetch({ throwHttpErrors: false });
// Close the ephemeral servers created by the address tests after each case.
const closeListeners: (() => void)[] = [];

afterEach(() => {
  for (const close of closeListeners.splice(0)) close();
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
    expect(address.network).toBeUndefined();
    expect(address.previous).toBeUndefined();

    const response = await fetch(address.local!);
    expect(response.ok);
  });

  // A real loopback listener must remain reachable without advertising a LAN URL.
  test.each(['localhost', '127.0.0.1', '::1'])(
    'omit the network address when listening on %s',
    async (host) => {
      vi.spyOn(httpUtilities, 'registerCloseListener').mockImplementation(
        (close) => closeListeners.push(close),
      );
      const address = await startServer({ port: 0, host }, config, {
        '--no-request-logging': true,
      });

      expect(address.network).toBeUndefined();
      expect((await fetch(address.local!)).statusCode).toBe(200);
    },
  );

  // Simulate bound addresses that need not be assigned to the test machine.
  // Only wildcard listeners can use a different interface's network address.
  test.each([
    ['127.42.0.1', 'IPv4', '127.42.0.1', false],
    ['::ffff:127.0.0.1', 'IPv6', '[::ffff:127.0.0.1]', false],
    ['192.0.2.20', 'IPv4', '192.0.2.20', false],
    ['2001:db8::1', 'IPv6', '[2001:db8::1]', false],
    ['0.0.0.0', 'IPv4', '0.0.0.0', true],
    ['::', 'IPv6', 'localhost', true],
  ] as const)(
    'format the bound address %s',
    async (host, family, local, wildcard) => {
      vi.spyOn(httpUtilities, 'registerCloseListener').mockImplementation(
        (close) => closeListeners.push(close),
      );
      vi.spyOn(httpUtilities, 'getNetworkAddress').mockReturnValue(
        '192.0.2.10',
      );
      vi.spyOn(Server.prototype, 'address').mockReturnValue({
        address: host,
        family,
        port: 4321,
      });
      const address = await startServer(
        { port: 0, host: '127.0.0.1' },
        config,
        {},
      );

      expect(address.local).toBe(`http://${local}:4321`);
      expect(address.network).toBe(
        wildcard ? 'http://192.0.2.10:4321' : undefined,
      );
    },
  );

  // Make sure the server starts on the specified port and host.
  test('start server on different port if port is already occupied', async () => {
    const address = await startServer({ port: 3002, host: '::1' }, config, {});

    expect(address.local).not.toBe('http://[::1]:3002');
    expect(address.local).toMatch(/^http:\/\/\[::1\]:\d+$/);
    expect(address.network).not.toMatch(/^http:\/\/.*:3002$/);
    expect(address.previous).toBe(3002);

    const response = await fetch(address.local!);
    expect(response.ok);
  });

  test('keep the requested host when falling back to a different port', async () => {
    const first = await startServer(
      { port: 3005, host: '127.0.0.1' },
      config,
      {},
    );
    expect(first.local).toBe('http://127.0.0.1:3005');

    const address = await startServer(
      { port: 3005, host: '127.0.0.1' },
      config,
      {},
    );

    expect(address.previous).toBe(3005);
    expect(address.local).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    expect(address.local).not.toBe('http://127.0.0.1:3005');
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
