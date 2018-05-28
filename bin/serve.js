#!/usr/bin/env node

// Native
const path = require('path');

// Packages
const Ajv = require('ajv');
const dotProp = require('dot-prop');
const checkForUpdate = require('update-check');
const chalk = require('chalk');
const micro = require('micro');
const arg = require('arg');
const handler = require('serve-handler');
const schema = require('@zeit/schemas/deployment/config-static');
const fs = require('fs-extra');

// Utilities
const pkg = require('../package');

const warning = message => chalk`{yellow WARNING:} ${message}`;
const info = message => chalk`{magenta INFO:} ${message}`;
const error = message => chalk`{red ERROR:} ${message}`;

const updateCheck = async isDebugging => {
	let update = null;

	try {
		update = await checkForUpdate(pkg);
	} catch (err) {
		const suffix = isDebugging ? ':' : ' (use `--debug` to see full error)';
		console.error(warning(`Checking for updates failed${suffix}`));

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

const startEndpoint = (endpoint, config) => {
	const server = micro(async (request, response) => handler(request, response, config));

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
			console.log(info(`Accepting connections at ${details}`));
		} else if (typeof details === 'object' && details.port) {
			console.log(info(`Accepting connections at http://localhost:${details.port}`));
		} else {
			console.log(info('Accepting connections'));
		}
	});
};

const loadConfig = async (cwd, entry) => {
	const paths = {
		'serve.json': null,
		'now.json': 'static',
		'package.json': 'now.static'
	};

	const config = {};

	for (const file of Object.keys(paths)) {
		const location = path.join(entry, file);
		const prop = paths[file];

		try {
			const content = await fs.readJSON(location);
			Object.assign(config, prop ? dotProp.get(content, prop) : content);
		} catch (err) {
			continue;
		}

		if (Object.keys(config).length !== 0) {
			console.log(info(`Discovered configuration in \`${file}\``));
			break;
		}
	}

	if (entry) {
		const {public} = config;
		config.public = path.relative(cwd, (public ? path.join(entry, public) : entry));
	}

	if (Object.keys(config).length !== 0) {
		const ajv = new Ajv();
		const validateSchema = ajv.compile(schema);

		if (!validateSchema(config)) {
			const defaultMessage = error('The configuration you provided is wrong:');
			const {message, params} = validateSchema.errors[0];

			console.error(`${defaultMessage}\n${message}\n${JSON.stringify(params)}`);
			process.exit(1);
		}
	}

	return config;
};

(async () => {
	let args = null;

	try {
		args = arg({
			'--help': Boolean,
			'--version': Boolean,
			'--listen': [parseEndpoint],
			'--debug': Boolean,
			'-h': '--help',
			'-v': '--version',
			'-l': '--listen',
			'-d': '--debug'
		});
	} catch (err) {
		console.error(error(err.message));
		process.exit(1);
	}

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

	if (args._.length > 1) {
		console.error(error('Please provide one path argument at maximum'));
		process.exit(1);
	}

	const cwd = process.cwd();
	const entry = args._.length > 0 ? path.join(cwd, args._[0]) : cwd;

	const config = await loadConfig(cwd, entry);

	for (const endpoint of args['--listen']) {
		startEndpoint(endpoint, config);
	}

	registerShutdown(() => {
		console.log(`\n${info('Gracefully shutting down. Please wait...')}`);

		process.on('SIGINT', () => {
			console.log(`\n${warning('Force-closing all open sockets...')}`);
			process.exit(0);
		});
	});
})();
