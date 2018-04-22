// Native

// Packages
const test = require('ava');

// Utilities
const {options, minimist} = require('../lib/options');

test('options options', t => {
	t.snapshot(options);
});

test('options minimist', t => {
	t.snapshot(minimist);
});
