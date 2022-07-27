// tests/config.test.ts
// Tests for the configuration loader.

import { afterEach, describe, test, expect, vi } from 'vitest';

import { loadConfiguration } from '../source/utilities/config.js';
import { logger } from '../source/utilities/logger.js';
import { Options } from '../source/types.js';

// The path to the fixtures for this test file.
const fixtures = 'tests/__fixtures__/config/';
// A helper function to load the configuration for a certain fixture.
const loadConfig = (
  name: 'valid' | 'invalid' | 'non-existent' | 'deprecated',
  args?: Partial<Options> = {},
) => loadConfiguration(process.cwd(), `${fixtures}/${name}`, args);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('utilities/config', () => {
  // Make sure the configuration is parsed correctly when it is in the
  // `serve.json` file.
  test('parse valid config', async () => {
    const configuration = await loadConfig('valid');
    expect(configuration).toMatchSnapshot();
  });

  // Make sure the configuration is parsed correctly when it is a location
  // specified by the `--config` option.
  test('parse valid config at custom location', async () => {
    const configuration = await loadConfig('custom', {
      '--config': 'config.json',
    });
    expect(configuration).toMatchSnapshot();
  });

  // When the configuration in the file is invalid, the function will throw an
  // error.
  test('throw error if config is invalid', async () => {
    loadConfig('invalid').catch((error: Error) => {
      expect(error.message).toMatch(/invalid/);
    });
  });

  // When no configuration file exists, the configuration should be populated
  // with the `etag` and `symlink` options set to their default values, and
  // the `public` option set to the path of the directory.
  test('return default configuration when no source is found', async () => {
    const configuration = await loadConfig('non-existent');
    expect(configuration).toMatchSnapshot();
  });

  // When the configuration source is deprecated, i.e., the configuration lives
  // in `now.json` or `package.json`, a warning should be printed.
  test('warn when configuration comes from a deprecated source', async () => {
    const consoleSpy = vi.spyOn(logger, 'warn');

    const configuration = await loadConfig('deprecated');
    expect(configuration).toMatchSnapshot();

    expect(consoleSpy).toHaveBeenCalledOnce();
    expect(consoleSpy).toHaveBeenLastCalledWith(
      expect.stringContaining('deprecated'),
    );
  });
});
