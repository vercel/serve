// source/utilities/cli.ts
// CLI-related utility functions.

import chalk from 'chalk';
// @ts-expect-error No type definitions.
import parseArgv from 'arg';
import { parseEndpoint } from './http.js';
import type { Arguments } from '../types.js';

// The options the CLI accepts, and how to parse them.
const options = {
  '--help': Boolean,
  '--version': Boolean,
  '--listen': [parseEndpoint],
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

  // The `-p` option is deprecated and is kept only for backwards-compatibility.
  '-p': '--listen',
};

// The help text for the CLI.
const helpText = chalk`
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

    -d, --debug                         Show debugging information

    -s, --single                        Rewrite all not-found requests to \`index.html\`

    -c, --config                        Specify custom path to \`serve.json\`

    -C, --cors                          Enable CORS, sets \`Access-Control-Allow-Origin\` to \`*\`

    -n, --no-clipboard                  Do not copy the local address to the clipboard

    -u, --no-compression                Do not compress files

    --no-etag                           Send \`Last-Modified\` header instead of \`ETag\`

    -S, --symlinks                      Resolve symlinks instead of showing 404 errors
    
    --ssl-cert                          Optional path to an SSL/TLS certificate to serve with HTTPS
    
    --ssl-key                           Optional path to the SSL/TLS certificate\'s private key

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
 * Parses the program's `process.argv` and returns the options and arguments.
 *
 * @returns The parsed options and arguments.
 */
export const parseArguments = (): Arguments => parseArgv(options);

/**
 * Returns the help text.
 *
 * @returns The help text shown when the `--help` option is used.
 */
export const getHelpText = (): string => helpText;
