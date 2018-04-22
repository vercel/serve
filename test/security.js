// Native
const path = require('path');

// Packages
const test = require('ava');
const fetch = require('node-fetch');
const micro = require('micro');
const listen = require('test-listen');

// Utilities
const server = require('../lib/server');

const securityAppPath = path.join(__dirname, 'fixtures', 'security');

test('blocks ignores', async t => {
	const srv = micro((req, res) =>
		server(req, res, {}, securityAppPath, ['test.txt']));

	const url = await listen(srv);
	const res = await fetch(`${url}/test.txt`);
	t.is(res.status, 404);
});

test('blocks ignores even when requesting urlencoded url', async t => {
	const srv = micro((req, res) =>
		server(req, res, {}, securityAppPath, ['test.txt']));

	const url = await listen(srv);
	const res = await fetch(`${url}/t%65st.txt`);
	t.is(res.status, 404);
});
