// source/utilities/http.ts
// Helper functions for the server.

import { parse } from 'node:url';
import { networkInterfaces as getNetworkInterfaces } from 'node:os';
import type { ListenEndpoint, ParsedEndpoint } from '../types.js';

const networkInterfaces = getNetworkInterfaces();

/**
 * Parse and return the endpoints from the given string.
 *
 * @param uriOrPort - The endpoint to listen on.
 * @returns A list of parsed endpoints.
 */
export const parseEndpoint = (uriOrPort: ListenEndpoint): ParsedEndpoint => {
  // If the endpoint is a port number, return it as is.
  // @ts-expect-error `isNaN` accepts strings too.
  if (!isNaN(uriOrPort)) return [uriOrPort];

  // Cast it as a string, since we know for sure it is not a number.
  const endpoint = uriOrPort as string;

  // We cannot use `new URL` here, otherwise it will not
  // parse the host properly and it would drop support for IPv6.
  const url = parse(endpoint);

  switch (url.protocol) {
    case 'pipe:': {
      const pipe = endpoint.replace(/^pipe:/, '');
      if (!pipe.startsWith('\\\\.\\'))
        throw new Error(`Invalid Windows named pipe endpoint: ${endpoint}`);

      return [pipe];
    }
    case 'unix:':
      if (!url.pathname)
        throw new Error(`Invalid UNIX domain socket endpoint: ${endpoint}`);

      return [url.pathname];
    case 'tcp:':
      url.port = url.port ?? '3000';
      url.hostname = url.hostname ?? 'localhost';

      return [parseInt(url.port, 10), url.hostname];
    default:
      throw new Error(
        `Unknown --listen endpoint scheme (protocol): ${url.protocol}`,
      );
  }
};

/**
 * Registers a function that runs on server shutdown.
 *
 * @param fn - The function to run on server shutdown
 */
export const registerCloseListener = (fn: () => void) => {
  let run = false;

  const wrapper = () => {
    if (!run) {
      run = true;
      fn();
    }
  };

  process.on('SIGINT', wrapper);
  process.on('SIGTERM', wrapper);
  process.on('exit', wrapper);
};

/**
 * Returns the IP address of the host.
 *
 * @returns The address of the host.
 */
export const getNetworkAddress = () => {
  for (const interfaceDetails of Object.values(networkInterfaces)) {
    if (!interfaceDetails) continue;

    for (const details of interfaceDetails) {
      const { address, family, internal } = details;

      if (family === 'IPv4' && !internal) return address;
    }
  }
};
