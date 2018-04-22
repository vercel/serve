// Native

// Packages
const test = require('ava');

// Utilities
const view = require('../lib/view');

test('view returns compiled handlebars template', t => {
	t.notThrows(view);
});
