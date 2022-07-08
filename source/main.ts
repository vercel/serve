#!/usr/bin/env node

// source/main.ts
// The CLI for the `serve-handler` module.

import path from 'node:path';
import chalk from 'chalk';
import boxen from 'boxen';
import clipboard from 'clipboardy';
// @ts-expect-error No type definitions.
import checkForUpdate from 'update-check';
import manifest from '../package.json';
import { resolve } from './utilities/promise.js';
import { startServer } from './utilities/server.js';
import { registerCloseListener } from './utilities/http.js';
import { parseArguments, getHelpText } from './utilities/cli.js';
import { loadConfiguration } from './utilities/config.js';
import { logger } from './utilities/logger.js';
import type { Arguments } from './types.js';

/**
 * Checks for updates to this package. If an update is available, it brings it
 * to the user's notice by printing a message to the console.
 *
 * @param debugMode - Whether or not we should print additional debug information.
 * @returns
 */
const printUpdateNotification = async (debugMode: boolean) => {
  const [error, update] = await resolve<{ latest: string }>(
     
    checkForUpdate(manifest),
  );

  if (error) {
    const suffix = debugMode ? ':' : ' (use `--debug` to see full error)';
    logger.warn(`Checking for updates failed${suffix}`);

    if (debugMode) logger.error(error.message);
  }
  if (!update) return;

  logger.log(
    chalk` {bgRed.white  UPDATE } The latest version of \`serve\` is ${update.latest}`,
  );
};

// Parse the options passed by the user.
let args: Arguments;
try {
  args = parseArguments();
} catch (error: any) {
  logger.error((error as Error).message);
  process.exit(1);
}

// Check for updates to the package unless the user sets the `NO_UPDATE_CHECK`
// variable.
if (process.env.NO_UPDATE_CHECK !== '1')
  await printUpdateNotification(args['--debug']);
// If the `version` or `help` arguments are passed, print the version or the
// help text and exit.
if (args['--version']) {
  logger.log(manifest.version);
  process.exit(0);
}
if (args['--help']) {
  logger.log(getHelpText());
  process.exit(0);
}

// Default to listening on port 3000.
// Disabling as this is not an unnecessary check.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (!args['--listen'])
  args['--listen'] = [
    [process.env.PORT ? parseInt(process.env.PORT, 10) : 3000],
  ];
// Ensure that the user has passed only one directory to serve.
if (args._.length > 1) {
  logger.error('Please provide one path argument at maximum');
  process.exit(1);
}

// Warn the user about using deprecated configuration files.
if (args['--config'] === 'now.json' || args['--config'] === 'package.json')
  logger.warn(
    'The config files `now.json` and `package.json` are deprecated. Please use `serve.json`.',
  );
// Parse the configuration.
const cwd = process.cwd();
const entry = args._[0] ? path.resolve(args._[0]) : cwd;
const config = await loadConfiguration(cwd, entry, args);

// If the user wants all the URLs rewritten to `/index.html`, make it happen.
if (args['--single']) {
  const { rewrites } = config;
  const existingRewrites = Array.isArray(rewrites) ? rewrites : [];

  // Ensure this is the first rewrite rule so it gets priority.
  config.rewrites = [
    {
      source: '**',
      destination: '/index.html',
    },
    ...existingRewrites,
  ];
}

// Start the server for each endpoint passed by the user.
for (const endpoint of args['--listen']) {
  // Disabling this rule as we want to start each server one by one.
  // eslint-disable-next-line no-await-in-loop
  const { local, network, previous } = await startServer(
    endpoint,
    config,
    args,
  );

  const copyAddress = !args['--no-clipboard'];

  // If we are not in a TTY or Node is running in production mode, print
  // a single line of text with the server address.
  if (!process.stdout.isTTY || process.env.NODE_ENV === 'production') {
    const suffix = local ? ` at ${local}` : '';
    logger.info(`Accepting connections${suffix}`);

    continue;
  }

  // Else print a fancy box with the server address.
  let message = chalk.green('Serving!');
  if (local) {
    const prefix = network ? '- ' : '';
    const space = network ? '            ' : '  ';

    message += `\n\n${chalk.bold(`${prefix}Local:`)}${space}${local}`;
  }
  if (network) message += `\n${chalk.bold('- On Your Network:')}  ${network}`;
  if (previous)
    message += chalk.red(
      `\n\nThis port was picked because ${chalk.underline(
        previous.toString(),
      )} is in use.`,
    );

  // Try to copy the address to the user's clipboard too.
  if (copyAddress && local) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await clipboard.write(local);
      message += `\n\n${chalk.grey('Copied local address to clipboard!')}`;
    } catch (error: any) {
      logger.error(`Cannot copy to clipboard: ${(error as Error).message}`);
    }
  }

  logger.log(
    boxen(message, {
      padding: 1,
      borderColor: 'green',
      margin: 1,
    }),
  );
}

// Print out a message to let the user know we are shutting down the server
// when they press Ctrl+C or kill the process externally.
registerCloseListener(() => {
  logger.log();
  logger.info('Gracefully shutting down. Please wait...');

  process.on('SIGINT', () => {
    logger.log();
    logger.warn('Force-closing all open sockets...');

    process.exit(0);
  });
});
