// Native

// Packages
const test = require('ava');

// Utilities
const api = require('../lib/api');

test.cb('api starts and can be stopped', t => {
	t.plan(1);

	const {stop} = api(); // Spawns process

	setTimeout(() => {
		stop();
		t.pass();
		t.end();
	}, 100);
});
