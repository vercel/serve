#!/usr/bin/env node

// Packages
const checkForUpdate = require('update-check');
const chalk = require('chalk');
const micro = require('micro');
const arg = require('arg');
const handler = require('serve-handler');

// Utilities
const pkg = require('../package');

const warning = message => chalk`{yellow WARNING:} ${message}`;

const updateCheck = async isDebugging => {
	let update = null;

	try {
		update = await checkForUpdate(pkg);
	} catch (err) {
		console.error(warning(`Checking for updates failed${isDebugging ? ':' : ' (use `--debug` to see full error)'}`));

		if (isDebugging) {
			console.error(err);
		}
	}

	if (!update) {
		return;
	}

	console.log(`${chalk.bgRed('UPDATE AVAILABLE')} The latest version of \`serve\` is ${update.latest}`);
};

const getHelp = () => chalk`
  {bold.cyan serve} - Static file serving and directory listing

  {bold USAGE}

      {bold $} {cyan serve} --help
      {bold $} {cyan serve} --version
      {bold $} {cyan serve} [-l {underline listen_uri} [-l ...]] [{underline directory}]

      By default, {cyan serve} will listen on {bold 0.0.0.0:3000} and serve the
      current working directory on that address.

      Specifying a single {bold --listen} argument will overwrite the default, not supplement it.

  {bold OPTIONS}

      --help                              Shows this help message

      -v, --version                       Displays the current version of serve

      -l, --listen {underline listen_uri}             Specify a URI endpoint on which to listen (see below) -
                                          more than one may be specified to listen in multiple places

      -d, --debug                         Show debugging information

  {bold ENDPOINTS}

      Listen endpoints (specified by the {bold --listen} or {bold -l} options above) instruct {cyan micro}
      to listen on one or more interfaces/ports, UNIX domain sockets, or Windows named pipes.

      For TCP (traditional host/port) endpoints:

          {bold $} {cyan serve} -l tcp://{underline hostname}:{underline 1234}

      For UNIX domain socket endpoints:

          {bold $} {cyan serve} -l unix:{underline /path/to/socket.sock}

      For Windows named pipe endpoints:

          {bold $} {cyan serve} -l pipe:\\\\.\\pipe\\{underline PipeName}
`;

const parseEndpoint = str => {
	const url = new URL(str);

	switch (url.protocol) {
	case 'pipe:': {
		// some special handling
		const cutStr = str.replace(/^pipe:/, '');

		if (cutStr.slice(0, 4) !== '\\\\.\\') {
			throw new Error(`Invalid Windows named pipe endpoint: ${str}`);
		}

		return [cutStr];
	}
	case 'unix:':
		if (!url.pathname) {
			throw new Error(`Invalid UNIX domain socket endpoint: ${str}`);
		}

		return [url.pathname];
	case 'tcp:':
		url.port = url.port || '3000';
		return [parseInt(url.port, 10), url.hostname];
	default:
		throw new Error(`Unknown --listen endpoint scheme (protocol): ${url.protocol}`);
	}
};

const registerShutdown = fn => {
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

const startEndpoint = endpoint => {
	const server = micro(async (request, response) => handler(request, response));

	server.on('error', err => {
		console.error('serve:', err.stack);
		process.exit(1);
	});

	server.listen(...endpoint, () => {
		const details = server.address();

		registerShutdown(() => server.close());

		// `micro` is designed to run only in production, so
		// this message is perfectly for prod
		if (typeof details === 'string') {
			console.log(`serve: Accepting connections on ${details}`);
		} else if (typeof details === 'object' && details.port) {
			console.log(`serve: Accepting connections on port ${details.port}`);
		} else {
			console.log('serve: Accepting connections');
		}
	});
};

(async () => {
	const args = arg({
		'--help': Boolean,
		'--version': Boolean,
		'--listen': [parseEndpoint],
		'--debug': Boolean,
		'-h': '--help',
		'-v': '--version',
		'-l': '--listen',
		'-d': '--debug'
	});

	await updateCheck(args['--debug']);

	if (args['--version']) {
		console.log(pkg.version);
		return;
	}

	if (args['--help']) {
		console.log(getHelp());
		return;
	}

	if (!args['--listen']) {
		// Default endpoint
		args['--listen'] = [[3000]];
	}

	for (const endpoint of args['--listen']) {
		startEndpoint(endpoint);
	}

	registerShutdown(() => console.log('serve: Gracefully shutting down. Please wait...'));
})();
