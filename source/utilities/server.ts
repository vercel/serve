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
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import type {
  Configuration,
  Options,
  ParsedEndpoint,
  Port,
  ServerAddress,
} from '../types.js';

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
  args: Options,
  previous?: Port,
): Promise<ServerAddress> => {
  // Define the request handler for the server.
  const serverHandler = async (
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> => {
    if (args['--cors']) response.setHeader('Access-Control-Allow-Origin', '*');
    // @ts-expect-error The `compression` library uses the Express Request type
    // instead of the native HTTP IncomingMessage type.
    if (!args['--no-compression']) await compress(request, response);

    // Let the `serve-handler` module do the rest.
    await handler(request, response, config);
  };

  // Create the server.
  const httpMode = args['--ssl-cert'] && args['--ssl-key'] ? 'https' : 'http';
  const sslPass = args['--ssl-pass'];
  const server =
    httpMode === 'https'
      ? https.createServer(
          {
            key: await readFile(args['--ssl-key']),
            cert: await readFile(args['--ssl-cert']),
            passphrase: sslPass ? await readFile(sslPass, 'utf8') : '',
          },
          serverHandler, // eslint-disable-line @typescript-eslint/no-misused-promises
        )
      : http.createServer(serverHandler); // eslint-disable-line @typescript-eslint/no-misused-promises

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
      // According to https://www.ietf.org/rfc/rfc2732.txt, IPv6 address should be
      // surrounded by square brackets (only the address, not the port).
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
    throw new Error(`Failed to serve: ${error.stack}`);
  });

  // If the endpoint is a non-zero port, make sure it is not occupied.
  // @ts-expect-error `isNaN` accepts strings too.
  if (!isNaN(endpoint[0]) && endpoint[0] !== 0) {
    const port = endpoint[0] as number;
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
    // @ts-expect-error I'm not sure why Typescript thinks this is invalid, the spread
    // operator should pass it a `number` or a `string` or a `number`, `string`.
    server.listen(...endpoint, () => resolve(getServerDetails()));
  });
};
