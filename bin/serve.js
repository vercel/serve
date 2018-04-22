#!/usr/bin/env node

// Native
const path = require('path');
const https = require('https');

// Packages
const micro = require('micro');
const args = require('args');
const compress = require('micro-compress');
const detect = require('detect-port');
const {coroutine} = require('bluebird');
const checkForUpdate = require('update-check');
const {red, bold} = require('chalk');
const nodeVersion = require('node-version');
const cert = require('openssl-self-signed-certificate');
const boxen = require('boxen');

// Utilities
const pkg = require('../package');
const listening = require('../lib/listening');
const serverHandler = require('../lib/server');
const {options, minimist} = require('../lib/options');

// Throw an error if node version is too low
if (nodeVersion.major < 6) {
	console.error(
		`${red(
			'Error!'
		)} Serve requires at least version 6 of Node. Please upgrade!`
	);
	process.exit(1);
}

// Register the list of options
args.options(options);

// And initialize `args`
const flags = args.parse(process.argv, {minimist});

// Figure out the content directory
const [directory] = args.sub;

// Don't log anything to the console if silent mode is enabled
if (flags.silent) {
	console.log = () => {};
}

process.env.ASSET_DIR = Math.random()
	.toString(36)
	.substr(2, 10);

let current = process.cwd();

if (directory) {
	current = path.resolve(process.cwd(), directory);
}

let ignoredFiles = ['.DS_Store', '.git/'];

if (flags.ignore && flags.ignore.length > 0) {
	ignoredFiles = ignoredFiles.concat(flags.ignore.split(','));
}

const handler = coroutine(function *run(req, res) {
	yield serverHandler(req, res, flags, current, ignoredFiles);
});

const httpsOpts = {
	key: cert.key,
	cert: cert.cert,
	passphrase: cert.passphrase
};

const microHttps = fn =>
	https.createServer(httpsOpts, (req, res) => micro.run(req, res, fn));
const server = flags.ssl
	? microHttps(flags.unzipped ? handler : compress(handler))
	: micro(flags.unzipped ? handler : compress(handler));

let {port} = flags;

detect(port).then(async open => {
	const {NODE_ENV} = process.env;

	if (NODE_ENV !== 'production') {
		const update = await checkForUpdate(pkg);

		if (update) {
			const message = `${bold(
				'UPDATE AVAILABLE:'
			)} The latest version of \`serve\` is ${update.latest}`;

			console.log(
				boxen(message, {
					padding: 1,
					borderColor: 'green',
					margin: 1
				})
			);
		}
	}

	let inUse = open !== port;

	if (inUse) {
		port = open;

		inUse = {
			old: flags.port,
			open
		};
	}

	const listenArgs = [
		server,
		current,
		inUse,
		flags.clipless !== true,
		flags.open,
		flags.ssl,
		flags.local
	];

	if (flags.local) {
		server.listen(port, 'localhost', listening.bind(this, ...listenArgs));
	} else {
		server.listen(port, listening.bind(this, ...listenArgs));
	}
});
