// source/utilities/cli.ts
// CLI-related utility functions.

import { parse as parseUrl } from 'node:url';
import { env } from 'node:process';
import chalk from 'chalk';
import chalkTemplate from 'chalk-template';
import parseArgv from 'arg';
import checkForUpdate from 'update-check';
import { resolve } from './promise.js';
import { logger } from './logger.js';
import type { Arguments, ParsedEndpoint } from '../types.js';

// The help text for the CLI.
const helpText = chalkTemplate`
  {bold.cyan serve} - Static file serving and directory listing

  {bold USAGE}

    {bold $} {cyan serve} --help
    {bold $} {cyan serve} --version
    {bold $} {cyan serve} folder_name
    {bold $} {cyan serve} [-l {underline listen_uri} [-l ...]] [{underline directory}]

    By default, {cyan serve} will listen on {bold 0.0.0.0:3000} and serve the
    current working directory on that address.

    Specifying a single {bold --listen} argument will overwrite the default, not supplement it.

  {bold OPTIONS}

    --help                              Shows this help message

    -v, --version                       Displays the current version of serve

    -l, --listen {underline listen_uri}             Specify a URI endpoint on which to listen (see below) -
                                        more than one may be specified to listen in multiple places

    -p                                  Specify custom port

    -s, --single                        Rewrite all not-found requests to \`index.html\`

    -d, --debug                         Show debugging information

    -c, --config                        Specify custom path to \`serve.json\`

    -L, --no-request-logging            Do not log any request information to the console.

    -C, --cors                          Enable CORS, sets \`Access-Control-Allow-Origin\` to \`*\`

    -n, --no-clipboard                  Do not copy the local address to the clipboard

    -u, --no-compression                Do not compress files

    --no-etag                           Send \`Last-Modified\` header instead of \`ETag\`

    -S, --symlinks                      Resolve symlinks instead of showing 404 errors
    
    --ssl-cert                          Optional path to an SSL/TLS certificate to serve with HTTPS
                                        {grey Supported formats: PEM (default) and PKCS12 (PFX)}
    
    --ssl-key                           Optional path to the SSL/TLS certificate\'s private key
                                        {grey Applicable only for PEM certificates}

    --ssl-pass                          Optional path to the SSL/TLS certificate\'s passphrase

    --no-port-switching                 Do not open a port other than the one specified when it\'s taken.

  {bold ENDPOINTS}

    Listen endpoints (specified by the {bold --listen} or {bold -l} options above) instruct {cyan serve}
    to listen on one or more interfaces/ports, UNIX domain sockets, or Windows named pipes.

    For TCP ports on hostname "localhost":

      {bold $} {cyan serve} -l {underline 1234}

    For TCP (traditional host/port) endpoints:

      {bold $} {cyan serve} -l tcp://{underline hostname}:{underline 1234}

    For UNIX domain socket endpoints:

      {bold $} {cyan serve} -l unix:{underline /path/to/socket.sock}

    For Windows named pipe endpoints:

      {bold $} {cyan serve} -l pipe:\\\\.\\pipe\\{underline PipeName}
`;

/**
 * Returns the help text.
 *
 * @returns The help text shown when the `--help` option is used.
 */
export const getHelpText = (): string => helpText;

/**
 * Parse and return the endpoints from the given string.
 *
 * @param uriOrPort - The endpoint to listen on.
 * @returns A list of parsed endpoints.
 */
export const parseEndpoint = (uriOrPort: string): ParsedEndpoint => {
  // If the endpoint is a port number, return it as is.
  if (!isNaN(Number(uriOrPort))) return { port: Number(uriOrPort) };

  // Cast it as a string, since we know for sure it is not a number.
  const endpoint = uriOrPort;

  // We cannot use `new URL` here, otherwise it will not
  // parse the host properly and it would drop support for IPv6.
  const url = parseUrl(endpoint);

  switch (url.protocol) {
    case 'pipe:': {
      const pipe = endpoint.replace(/^pipe:/, '');
      if (!pipe.startsWith('\\\\.\\'))
        throw new Error(`Invalid Windows named pipe endpoint: ${endpoint}`);

      return { host: pipe };
    }
    case 'unix:':
      if (!url.pathname)
        throw new Error(`Invalid UNIX domain socket endpoint: ${endpoint}`);

      return { host: url.pathname };
    case 'tcp:':
      url.port = url.port ?? '3000';
      url.hostname = url.hostname ?? 'localhost';

      return {
        port: Number(url.port),
        host: url.hostname,
      };
    default:
      throw new Error(
        `Unknown --listen endpoint scheme (protocol): ${
          url.protocol ?? 'undefined'
        }`,
      );
  }
};

// The options the CLI accepts, and how to parse them.
const options = {
  '--help': Boolean,
  '--version': Boolean,
  '--listen': [parseEndpoint] as [typeof parseEndpoint],
  '--single': Boolean,
  '--debug': Boolean,
  '--config': String,
  '--no-clipboard': Boolean,
  '--no-compression': Boolean,
  '--no-etag': Boolean,
  '--symlinks': Boolean,
  '--cors': Boolean,
  '--no-port-switching': Boolean,
  '--ssl-cert': String,
  '--ssl-key': String,
  '--ssl-pass': String,
  '--no-request-logging': Boolean,
  // A list of aliases for the above options.
  '-h': '--help',
  '-v': '--version',
  '-l': '--listen',
  '-s': '--single',
  '-d': '--debug',
  '-c': '--config',
  '-n': '--no-clipboard',
  '-u': '--no-compression',
  '-S': '--symlinks',
  '-C': '--cors',
  '-L': '--no-request-logging',

  // The `-p` option is deprecated and is kept only for backwards-compatibility.
  '-p': '--listen',
};

/**
 * Parses the program's `process.argv` and returns the options and arguments.
 *
 * @returns The parsed options and arguments.
 */
export const parseArguments = (): Arguments => parseArgv(options);

/**
 * Checks for updates to this package. If an update is available, it brings it
 * to the user's notice by printing a message to the console.
 */
export const checkForUpdates = async (manifest: object): Promise<void> => {
  // Do not check for updates if the `NO_UPDATE_CHECK` variable is set.
  if (env.NO_UPDATE_CHECK) return;

  // Check for a newer version of the package.
  const [error, update] = await resolve(checkForUpdate(manifest));

  // If there is an error, throw it; and if there is no update, return.
  if (error) throw error;
  if (!update) return;

  // If a newer version is available, tell the user.
  logger.log(
    chalk.bgRed.white(' UPDATE '),
    `The latest version of \`serve\` is ${update.latest}`,
  );
};
