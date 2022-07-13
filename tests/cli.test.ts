// tests/cli.test.ts
// Tests for the CLI part of the project.

import { describe, test, expect } from 'vitest';

import { getHelpText, parseEndpoint } from '../source/utilities/cli.js';
import { ParsedEndpoint } from '../source/types.js';

// A list of cases used to test the `parseEndpoint` function. The first element
// is the name of the case, followed by the input to pass to the function,
// followed by the expected output.
type EndpointTestCase = [string, string, ParsedEndpoint];
const validEndpoints = [
  ['http port', '4242', [4242]],
  ['tcp url', 'tcp://localhost:4242', [4242, 'localhost']],
  ['unix socket', 'unix:///dev/sock1', ['/dev/sock1']],
  ['pipe', 'pipe:\\\\.\\pipe\\localhost', ['\\\\.\\pipe\\localhost']],
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
});
