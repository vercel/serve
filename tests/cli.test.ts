// tests/cli.test.ts
// Tests for the CLI part of the project.

import { describe, test, expect } from 'vitest';

import { getHelpText, parseEndpoint } from '../source/utilities/cli.js';
import { ParsedEndpoint } from '../source/types.js';

type EndpointTestCase = [string, string, ParsedEndpoint];
const validEndpoints = [
  ['http port', '4242', [4242]],
  ['tcp url', 'tcp://localhost:4242', [4242, 'localhost']],
  ['unix socket', 'unix:///dev/sock1', ['/dev/sock1']],
  ['pipe', 'pipe:\\\\.\\pipe\\localhost', ['\\\\.\\pipe\\localhost']],
] as EndpointTestCase[];

describe('utilities/cli', () => {
  test('render help text', () => expect(getHelpText()).toMatchSnapshot());

  test.each(validEndpoints)(
    'parse %s as endpoint',
    (_name, endpoint, parsedEndpoint) =>
      expect(parseEndpoint(endpoint)).toEqual(parsedEndpoint),
  );

  test('detect invalid unix socket', () =>
    expect(() => parseEndpoint('unix://')).toThrow(/invalid.*unix.*/i));
  test('detect invalid windows pipe', () =>
    expect(() => parseEndpoint('pipe:\\localhost')).toThrow(
      /invalid.*pipe.*/i,
    ));
  test('detect invalid endpoint protocol', () =>
    expect(() => parseEndpoint('ws://localhost')).toThrow(
      /unknown.*endpoint.*scheme.*/i,
    ));
});
