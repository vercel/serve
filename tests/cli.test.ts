// tests/cli.test.ts
// Tests for the CLI part of the project.

import { env } from 'node:process';
import { afterEach, describe, test, expect, vi } from 'vitest';

import manifest from '../package.json';
import {
  getHelpText,
  parseEndpoint,
  checkForUpdates,
} from '../source/utilities/cli.js';
import { logger } from '../source/utilities/logger.js';
import { ParsedEndpoint } from '../source/types.js';

afterEach(() => {
  vi.restoreAllMocks();
});

// A list of cases used to test the `parseEndpoint` function. The first element
// is the name of the case, followed by the input to pass to the function,
// followed by the expected output.
type EndpointTestCase = [string, string, ParsedEndpoint];
const validEndpoints = [
  ['http port', '4242', { port: 4242 }],
  ['tcp url', 'tcp://localhost:4242', { port: 4242, host: 'localhost' }],
  ['unix socket', 'unix:///dev/sock1', { host: '/dev/sock1' }],
  ['pipe', 'pipe:\\\\.\\pipe\\localhost', { host: '\\\\.\\pipe\\localhost' }],
] as EndpointTestCase[];
// Another list of cases used to test the `parseEndpoint` function. The function
// should throw an error when parsing any of these cases, as they are invalid
// endpoints.
type InvalidEndpointTestCase = [string, string, RegExp];
const invalidEndpoints = [
  ['protocol', 'ws://localhost', /unknown.*endpoint.*scheme.*/i],
  ['unix socket', 'unix://', /invalid.*unix.*socket.*/i],
  ['windows pipe', 'pipe:\\localhost', /invalid.*pipe.*/i],
] as InvalidEndpointTestCase[];

describe('utilities/cli', () => {
  // Make sure the help message remains the same. If we are changing the help
  // message, then make sure to run `vitest` with the `--update-snapshot` flag.
  test('render help text', () => expect(getHelpText()).toMatchSnapshot());

  // Make sure the `parseEndpoint` function parses valid endpoints correctly.
  test.each(validEndpoints)(
    'parse %s as endpoint',
    (_name, endpoint, parsedEndpoint) =>
      expect(parseEndpoint(endpoint)).toEqual(parsedEndpoint),
  );

  // Make sure `parseEndpoint` throws errors on invalid endpoints.
  test.each(invalidEndpoints)(
    'parse %s as endpoint',
    (_name, endpoint, error) =>
      expect(() => parseEndpoint(endpoint)).toThrow(error),
  );

  // Make sure the update message is shown when the current version is not
  // the latest version.
  test('print update message when newer version exists', async () => {
    const consoleSpy = vi.spyOn(logger, 'log');

    await checkForUpdates({
      ...manifest,
      version: '0.0.0',
    });

    expect(consoleSpy).toHaveBeenCalledOnce();
    expect(consoleSpy).toHaveBeenLastCalledWith(
      expect.stringContaining('UPDATE'),
      expect.stringContaining('latest'),
    );
  });

  // Make sure the update message is not shown when the latest version is
  // running.
  test('do not print update message when on latest version', async () => {
    const consoleSpy = vi.spyOn(logger, 'log');

    await checkForUpdates({
      ...manifest,
      version: '99.99.99',
    });

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  // Make sure an update check does not occur when the NO_UPDATE_CHECK env var
  // is set.
  test('do not check for updates when NO_UPDATE_CHECK is set', async () => {
    const consoleSpy = vi.spyOn(logger, 'log');

    env.NO_UPDATE_CHECK = 'true';
    await checkForUpdates({
      ...manifest,
      version: '0.0.0',
    });
    env.NO_UPDATE_CHECK = undefined;

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
