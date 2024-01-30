import readline from 'node:readline';
import chalk from 'chalk';
import { logger } from './logger';
import { openBrowser } from './openBrowser';

import type { ServerAddress } from '../types.js';

import { getHelpText } from '../utilities/cli.js';

export type CLIShortcut = {
  key: string;
  description: string;
  action: (server?: ServerAddress) => void | Promise<void>;
  perServerInstance: boolean;
};

const BASE_PREVIEW_SHORTCUTS: CLIShortcut[] = [
  {
    key: 'o',
    description: 'open in browser',
    action(server) {
      const url = server?.local ?? server?.network;
      if (url) {
        openBrowser(url, true, logger);
      } else {
        logger.warn('No URL available to open in browser');
      }
    },
    perServerInstance: true,
  },
  {
    key: 'q',
    description: 'quit',
    action(/* server */) {
      try {
        // server.httpServer.close();
      } finally {
        process.exit();
      }
    },
    perServerInstance: false,
  },
];

type Servers = ServerAddress[];

export function bindCLIShortcuts(servers: Servers): void {
  // if (!server.httpServer || !process.stdin.isTTY || process.env.CI) {
  //   return;
  // }

  // Write some help info to the console.
  logger.info(
    chalk.dim(chalk.green('  ➜')) +
      chalk.dim('  press ') +
      chalk.bold('h + enter') +
      chalk.dim(' to show help'),
  );

  const shortcuts = BASE_PREVIEW_SHORTCUTS; // In future you can concat mutliple arrays here.

  let actionRunning = false;

  const onInput = async (input: string) => {
    if (actionRunning) return;

    if (input === 'h') {
      const loggedKeys = new Set<string>();
      logger.info('  Shortcuts');

      for (const shortcut of shortcuts) {
        if (loggedKeys.has(shortcut.key)) continue;
        loggedKeys.add(shortcut.key);

        if (typeof shortcut.action !== 'function') continue;

        logger.info(
          chalk.dim('  press ') +
            chalk.bold(`${shortcut.key} + enter`) +
            chalk.dim(` to ${shortcut.description}`),
        );
      }

      logger.log(getHelpText());

      return;
    }

    const shortcut = shortcuts.find((shortcutTmp) => shortcutTmp.key === input);

    if (!shortcut || typeof shortcut.action !== 'function') return;

    actionRunning = true;
    if (shortcut.perServerInstance) {
      // We want to execute action for each server instance.
      for (const server of servers) {
        // eslint-disable-next-line no-await-in-loop
        await shortcut.action(server);
      }
    } else {
      await shortcut.action();
    }
    actionRunning = false;
  };

  // Create single instance of the listener for readline.
  const rl = readline.createInterface({ input: process.stdin });
  rl.on('line', (input) => {
    onInput(input).catch((error) => {
      logger.error(`Error handling input:`, JSON.stringify(error));
    });
  });

  // TODO: Important! Close the readline interface when the server closes.
  // TODO: server.httpServer.on('close', () => rl.close());
  // let closedServers = 0;
  // for (const server of servers) {
  //   server.httpServer.on('close', () => {
  //     closedServers++;
  //     if (closedServers === servers.length) {
  //       rl.close();
  //     }
  //   });
  // }
}
