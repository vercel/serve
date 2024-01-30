/**
 * The following is modified based on source found in
 * https://github.com/facebook/create-react-app
 *
 * MIT Licensed
 * Copyright (c) 2015-present, Facebook, Inc.
 * https://github.com/facebook/create-react-app/blob/master/LICENSE
 *
 */

import { join } from 'node:path';
import { exec } from 'node:child_process';
import open from 'open';
import spawn from 'cross-spawn';
import chalk from 'chalk';
import { SERVE_PACKAGE_DIR } from './package-directory.js';
import type { Logger } from '../types.js';
import type { ExecOptions, ChildProcess } from 'node:child_process';
import type { Options } from 'open';
/**
 * Reads the BROWSER environment variable and decides what to do with it.
 */
export function openBrowser(
  url: string,
  opt: string | true,
  logger: Logger, // Logger,
): void {
  // The browser executable to open.
  // See https://github.com/sindresorhus/open#app for documentation.
  const browser: string | undefined =
    typeof opt === 'string' ? opt : process.env.BROWSER || '';
  if (browser.toLowerCase().endsWith('.js')) {
    executeNodeScript(browser, url, logger);
  } else if (browser.toLowerCase() !== 'none') {
    const browserArgs = process.env.BROWSER_ARGS
      ? process.env.BROWSER_ARGS.split(' ')
      : [];
    startBrowserProcess(browser, browserArgs, url, logger).catch((error) => {
      logger.log(`Error: ${JSON.stringify(error)}`);
    });
  }
}

function executeNodeScript(scriptPath: string, url: string, logger: Logger) {
  const extraArgs: string[] = process.argv.slice(2);

  const child: ChildProcess = spawn(
    `${process.execPath}`,
    [scriptPath, ...extraArgs, url],
    {
      stdio: 'inherit',
    },
  );

  child.on('close', (code) => {
    if (code !== 0) {
      logger.error(
        chalk.red(
          `\nThe script specified as BROWSER environment variable failed.\n\n${chalk.cyan(
            scriptPath,
          )} exited with code ${code ?? ''}.`,
        ),
        JSON.stringify({ error: null }),
      );
    }
  });
}

const supportedChromiumBrowsers = [
  'Google Chrome Canary',
  'Google Chrome Dev',
  'Google Chrome Beta',
  'Google Chrome',
  'Microsoft Edge',
  'Brave Browser',
  'Vivaldi',
  'Chromium',
];

async function startBrowserProcess(
  browserName: string | undefined,
  browserArgs: string[],
  url: string,
  logger: Logger,
) {
  let browser = browserName;
  // If we're on OS X, the user hasn't specifically
  // requested a different browser, we can try opening
  // a Chromium browser with AppleScript. This lets us reuse an
  // existing tab when possible instead of creating a new one.
  const preferredOSXBrowser =
    browser === 'google chrome' ? 'Google Chrome' : browser;
  const shouldTryOpenChromeWithAppleScript =
    process.platform === 'darwin' &&
    (!preferredOSXBrowser ||
      supportedChromiumBrowsers.includes(preferredOSXBrowser));

  if (shouldTryOpenChromeWithAppleScript) {
    try {
      const ps = await execAsync('ps cax');
      const openedBrowser =
        preferredOSXBrowser && ps.includes(preferredOSXBrowser)
          ? preferredOSXBrowser
          : supportedChromiumBrowsers.find((b) => ps.includes(b));
      if (openedBrowser) {
        // Try our best to reuse existing tab with AppleScript
        await execAsync(
          `osascript openChrome.applescript "${encodeURI(
            url,
          )}" "${openedBrowser}"`,
          {
            cwd: join(SERVE_PACKAGE_DIR, 'bin'),
          },
        );
        return true;
      }
    } catch (err) {
      // Ignore errors
      // console.log(err);
    }
  }

  // Another special case: on OS X, check if BROWSER has been set to "open".
  // In this case, instead of passing the string `open` to `open` function (which won't work),
  // just ignore it (thus ensuring the intended behavior, i.e. opening the system browser):
  // https://github.com/facebook/create-react-app/pull/1690#issuecomment-283518768
  if (process.platform === 'darwin' && browser === 'open') {
    browser = undefined;
  }

  // Fallback to open
  // (It will always open new tab)
  try {
    const options: Options | undefined = browser
      ? { app: { name: browser, arguments: browserArgs } }
      : {};
    open(url, options).catch((error) => {
      logger.error(`Error: ${JSON.stringify(error, null, 2)}`);
    }); // Prevent `unhandledRejection` error.
    return true;
  } catch (err) {
    return false;
  }
}

function execAsync(command: string, options?: ExecOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout.toString());
      }
    });
  });
}
