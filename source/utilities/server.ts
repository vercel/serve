// source/utilities/server.ts
// Run the server with the given configuration.

import http from 'node:http';
import https from 'node:https';
import { readFile } from 'node:fs/promises';
import handler from 'serve-handler';
import compression from 'compression';
import isPortReachable from 'is-port-reachable';
import chalk from 'chalk';
import { getNetworkAddress, registerCloseListener } from './http.js';
import { promisify } from './promise.js';
import { logger } from './logger.js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import type {
  Configuration,
  Options,
  ParsedEndpoint,
  Port,
  ServerAddress,
} from '../types.js';

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const compress = promisify(compression());

/**
 * Starts the server and makes it listen on the given endpoint.
 *
 * @param endpoint - The endpoint to listen on.
 * @param config - The configuration for the `serve-handler` middleware.
 * @param args - The arguments passed to the CLI.
 * @returns The address of the server.
 */
export const startServer = async (
  endpoint: ParsedEndpoint,
  config: Partial<Configuration>,
  args: Partial<Options>,
  previous?: Port,
): Promise<ServerAddress> => {
  // Define the request handler for the server.
  const serverHandler = (
    request: IncomingMessage,
    response: ServerResponse,
  ): void => {
    // We can't return a promise in a HTTP request handler, so we run our code
    // inside an async function instead.
    const run = async () => {
      type ExpressRequest = Parameters<typeof compress>[0];
      type ExpressResponse = Parameters<typeof compress>[1];

      // Log the request.
      const requestTime = new Date();
      const formattedTime = `${requestTime.toLocaleDateString()} ${requestTime.toLocaleTimeString()}`;
      const ipAddress =
        request.socket.remoteAddress?.replace('::ffff:', '') ?? 'unknown';
      const requestUrl = `${request.method ?? 'GET'} ${request.url ?? '/'}`;
      if (!args['--no-request-logging'])
        logger.http(
          chalk.dim(formattedTime),
          chalk.yellow(ipAddress),
          chalk.cyan(requestUrl),
        );

      if (args['--cors']) {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Headers', '*');
        response.setHeader('Access-Control-Allow-Credentials', 'true');
        response.setHeader('Access-Control-Allow-Private-Network', 'true');
      }
      if (!args['--no-compression'])
        await compress(request as ExpressRequest, response as ExpressResponse);

      // Let the `serve-handler` module do the rest.
      await handler(request, response, config);

      // Before returning the response, log the status code and time taken.
      const responseTime = Date.now() - requestTime.getTime();
      if (!args['--no-request-logging'])
        logger.http(
          chalk.dim(formattedTime),
          chalk.yellow(ipAddress),
          chalk[response.statusCode < 400 ? 'green' : 'red'](
            `Returned ${response.statusCode} in ${responseTime} ms`,
          ),
        );
    };

    // Then we run the async function, and re-throw any errors.
    run().catch((error: Error) => {
      throw error;
    });
  };

  // Create the server.
  const sslCert = args['--ssl-cert'];
  const sslKey = args['--ssl-key'];
  const sslPass = args['--ssl-pass'];
  const isPFXFormat =
    sslCert && /[.](?<extension>pfx|p12)$/.exec(sslCert) !== null;
  const useSsl = sslCert && (sslKey || sslPass || isPFXFormat);

  let serverConfig: http.ServerOptions | https.ServerOptions = {};
  if (useSsl && sslCert && sslKey) {
    // Format detected is PEM due to usage of SSL Key and Optional Passphrase.
    serverConfig = {
      key: await readFile(sslKey),
      cert: await readFile(sslCert),
      passphrase: sslPass ? await readFile(sslPass, 'utf8') : '',
    };
  } else if (useSsl && sslCert && isPFXFormat) {
    // Format detected is PFX.
    serverConfig = {
      pfx: await readFile(sslCert),
      passphrase: sslPass ? await readFile(sslPass, 'utf8') : '',
    };
  }

  const server = useSsl
    ? https.createServer(serverConfig, serverHandler)
    : http.createServer(serverHandler);

  // Once the server starts, return the address it is running on so the CLI
  // can tell the user.
  const getServerDetails = () => {
    // Make sure to close the server once the process ends.
    registerCloseListener(() => server.close());

    // Once the server has started, get the address the server is running on
    // and return it.
    const details = server.address() as string | AddressInfo;
    let local: string | undefined;
    let network: string | undefined;
    if (typeof details === 'string') {
      local = details;
    } else if (typeof details === 'object' && details.port) {
      // According to https://www.ietf.org/rfc/rfc2732.txt, IPv6 addresses
      // should be surrounded by square brackets (only the address, not the
      // port).
      let address;
      if (details.address === '::') address = 'localhost';
      else if (details.family === 'IPv6') address = `[${details.address}]`;
      else address = details.address;
      const ip = getNetworkAddress();

      const protocol = useSsl ? 'https' : 'http';
      local = `${protocol}://${address}:${details.port}`;
      network = ip ? `${protocol}://${ip}:${details.port}` : undefined;
    }

    return {
      local,
      network,
      previous,
    };
  };

  // Listen for any error that occurs while serving, and throw an error
  // if any errors are received.
  server.on('error', (error) => {
    throw new Error(
      `Failed to serve: ${error.stack?.toString() ?? error.message}`,
    );
  });

  // If the endpoint is a non-zero port, make sure it is not occupied.
  if (
    typeof endpoint.port === 'number' &&
    !isNaN(endpoint.port) &&
    endpoint.port !== 0
  ) {
    const port = endpoint.port;
    const isClosed = await isPortReachable(port, {
      host: endpoint.host ?? 'localhost',
    });
    // If the port is already taken, then start the server on a random port
    // instead.
    if (isClosed) return startServer({ port: 0 }, config, args, port);

    // Otherwise continue on to starting the server.
  }

  // Finally, start the server.
  return new Promise((resolve, _reject) => {
    // If only a port is specified, listen on the given port on localhost.
    if (
      typeof endpoint.port !== 'undefined' &&
      typeof endpoint.host === 'undefined'
    )
      server.listen(endpoint.port, () => resolve(getServerDetails()));
    // If the path to a socket or a pipe is given, listen on it.
    else if (
      typeof endpoint.port === 'undefined' &&
      typeof endpoint.host !== 'undefined'
    )
      server.listen(endpoint.host, () => resolve(getServerDetails()));
    // If a port number and hostname are given, listen on `host:port`.
    else if (
      typeof endpoint.port !== 'undefined' &&
      typeof endpoint.host !== 'undefined'
    )
      server.listen(endpoint.port, endpoint.host, () =>
        resolve(getServerDetails()),
      );
  });
};
