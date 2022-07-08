// source/utilities/config.ts
// Parse and return the configuration for the CLI.

import {
  resolve as resolvePath,
  relative as resolveRelativePath,
} from 'node:path';
import { readFile } from 'node:fs/promises';
import Ajv from 'ajv';
// @ts-expect-error No type definitions.
import schema from '@zeit/schemas/deployment/config-static.js';
import { resolve } from './promise.js';
import type { ErrorObject } from 'ajv';
import type { Configuration, Options, NodeError } from '../types.js';

/**
 * Parses and returns a configuration object from the designated locations.
 *
 * @param cwd - The current working directory.
 * @param entry - The directory to serve.
 * @param args - The arguments passed to the CLI.
 *
 * @returns The parsed configuration.
 */
export const loadConfiguration = async (
  cwd: string,
  entry: string,
  args: Options,
): Promise<Configuration> => {
  const files = ['serve.json', 'now.json', 'package.json'];
  if (args['--config']) files.unshift(args['--config']);

  const config: Partial<Configuration> = {};
  for (const file of files) {
    // Resolve the path to the configuration file relative to the directory
    // with the content in it.
    const location = resolvePath(entry, file);

    // Disabling the lint rule as we don't want to read all the files at once;
    // if we can retrieve the configuration from the first file itself, we
    // shouldn't waste time and resources fetching the other files too.
    // eslint-disable-next-line no-await-in-loop
    const [error, rawContents] = await resolve<string, NodeError>(
      readFile(location, 'utf8'),
    );
    if (error) {
      if (error.code === 'ENOENT' && file !== args['--config']) continue;
      else
        throw new Error(
          `Could not read configuration from file ${location}: ${error.message}`,
        );
    }

    // Parse the JSON in the file. If the parsed JSON is not an object, or the
    // file does not contain valid JSON, throw an error.
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawContents);
      if (typeof parsedJson !== 'object')
        throw new Error('configuration is not an object');
    } catch (parserError: any) {
      throw new Error(
        `Could not parse ${location} as JSON: ${
          (parserError as Error).message
        }`,
      );
    }

    // The lint rules have been disabled here because we don't know for sure
    // what the contents of these files are. In case anything is undefined and
    // an error is thrown, we simply move on - so there's no need to be careful
    // of unsafe property access.
    try {
      switch (file) {
        case 'now.json':
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          parsedJson = (parsedJson as any).static;
          break;
        case 'package.json':
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          parsedJson = (parsedJson as any).now.static;
          break;
      }
    } catch {
      // If these files don't have a serve-specific section, find it in another
      // config file.
      continue;
    }

    // Once we have found a valid configuration, assign it and stop looking
    // through more configuration files.
    Object.assign(config, parsedJson);
    break;
  }

  // Make sure the directory with the content is relative to the entry path
  // provided by the user.
  if (entry) {
    const staticDirectory = config.public;
    config.public = resolveRelativePath(
      cwd,
      staticDirectory ? resolvePath(entry, staticDirectory) : entry,
    );
  }

  // If the configuration isn't empty, validate it against the AJV schema.
  if (Object.keys(config).length !== 0) {
    const ajv = new Ajv({ allowUnionTypes: true });
    const validate = ajv.compile(schema as object);

    if (!validate(config) && validate.errors) {
      const defaultMessage = 'The configuration you provided is wrong:';
      const error = validate.errors[0] as ErrorObject;

      throw new Error(
        `${defaultMessage}\n${error.message}\n${JSON.stringify(error.params)}`,
      );
    }
  }

  // Configure defaults based on the options the user has passed.
  config.etag = !args['--no-etag'];
  config.symlinks = args['--symlinks'] || config.symlinks;

  return config as Configuration;
};
