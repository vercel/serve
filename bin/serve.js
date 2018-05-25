#!/usr/bin/env node

// Packages
const boxen = require('boxen');
const checkForUpdate = require('update-check');
const {bold} = require('chalk');

// Utilities
const pkg = require('../package');

const {NODE_ENV} = process.env;

const updateCheck = async () => {
	if (NODE_ENV === 'production') {
		return;
	}

	const boxenConfig = {
		padding: 1,
		margin: 1,
		borderColor: 'green'
	};

	let update = null;

	try {
		update = await checkForUpdate(pkg);
	} catch (err) {
		const message = `${bold('UPDATE CHECK FAILED:')} ${err.message}`;

		console.error(boxen(message, Object.assign({}, boxenConfig, {
			borderColor: 'red'
		})));
	}

	if (!update) {
		return;
	}

	const message = `${bold('UPDATE AVAILABLE:')} The latest version of \`serve\` is ${update.latest}`;
	console.error(boxen(message, boxenConfig));
};

(async () => {
	await updateCheck();
})();
