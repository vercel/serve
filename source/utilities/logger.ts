// source/utilities/logger.ts
// A simple colorized console logger.

/* eslint no-console: 0 */

import chalk from 'chalk';

const info = (...message: string[]) =>
  console.error(chalk.magenta('INFO:', ...message));
const warn = (...message: string[]) =>
  console.error(chalk.yellow('WARNING:', ...message));
const error = (...message: string[]) =>
  console.error(chalk.red('ERROR:', ...message));
const log = console.log;

export const logger = { info, warn, error, log };
