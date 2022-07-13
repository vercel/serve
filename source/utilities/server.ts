// source/utilities/server.ts
// Run the server with the given configuration.

import http from 'node:http';
import https from 'node:https';
import { readFile } from 'node:fs/promises';
import handler from 'serve-handler';
import compression from 'compression';
import isPortReachable from 'is-port-reachable';
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
import chalk from 'chalk';

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
      const ipAddress = request.socket.remoteAddress;
      const requestUrl = `${request.method?.toLowerCase()} ${request.url}`;
      if (args['--log-requests'])
        logger.http(
          chalk.dim(formattedTime),
          chalk.yellow(ipAddress),
          chalk.cyan(requestUrl),
        );

      if (args['--cors'])
        response.setHeader('Access-Control-Allow-Origin', '*');
      if (!args['--no-compression'])
        await compress(request as ExpressRequest, response as ExpressResponse);

      // Let the `serve-handler` module do the rest.
      await handler(request, response, config);

      // Before returning the response, log the status code and time taken.
      const responseTime = Date.now() - requestTime.getTime();
      if (args['--log-requests'])
        logger.http(
          chalk.dim(formattedTime),
          chalk.yellow(ipAddress),
          chalk[response.statusCode < 400 ? 'green' : 'red'](
            `returned ${response.statusCode} in ${responseTime} ms`,
          ),
        );
    };

    // Then we run the async function, and re-throw any errors.
    run().catch((error: Error) => {
      throw error;
    });
  };

  // Create the server.
  const useSsl = args['--ssl-cert'] && args['--ssl-key'];
  const httpMode = useSsl ? 'https' : 'http';
  const sslPass = args['--ssl-pass'];
  const serverConfig =
    httpMode === 'https' && args['--ssl-cert'] && args['--ssl-key']
      ? {
          key: await readFile(args['--ssl-key']),
          cert: await readFile(args['--ssl-cert']),
          passphrase: sslPass ? await readFile(sslPass, 'utf8') : '',
        }
      : {};
  const server =
    httpMode === 'https'
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

      local = `${httpMode}://${address}:${details.port}`;
      network = ip ? `${httpMode}://${ip}:${details.port}` : undefined;
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
    typeof endpoint[0] === 'number' &&
    !isNaN(endpoint[0]) &&
    endpoint[0] !== 0
  ) {
    const port = endpoint[0];
    const isClosed = await isPortReachable(port, {
      host: endpoint[1] ?? 'localhost',
    });
    // If the port is already taken, then start the server on a random port
    // instead.
    if (isClosed) return startServer([0], config, args, port);

    // Otherwise continue on to starting the server.
  }

  // Finally, start the server.
  return new Promise((resolve, _reject) => {
    // If only a port is specified, listen on the given port on localhost.
    if (endpoint.length === 1 && typeof endpoint[0] === 'number')
      server.listen(endpoint[0], () => resolve(getServerDetails()));
    // If the path to a socket or a pipe is given, listen on it.
    else if (endpoint.length === 1 && typeof endpoint[0] === 'string')
      server.listen(endpoint[0], () => resolve(getServerDetails()));
    // If a port number and hostname are given, listen on `host:port`.
    else if (
      endpoint.length === 2 &&
      typeof endpoint[0] === 'number' &&
      typeof endpoint[1] === 'string'
    )
      server.listen(endpoint[0], endpoint[1], () =>
        resolve(getServerDetails()),
      );
  });
};
