#!/usr/bin/env node

// Packages
const updateNotifier = require('update-notifier')
const {red} = require('chalk')
const nodeVersion = require('node-version')

// Ours
const pkg = require('../package')

// Throw an error if node version is too low
if (nodeVersion.major < 6) {
  console.error(`${red('Error!')} Serve requires at least version 6 of Node. Please upgrade!`)
  process.exit(1)
}

// Let user know if there's an update
// This isn't important when deployed to Now
if (!process.env.NOW && pkg.dist) {
  updateNotifier({pkg}).notify()
}

require('../lib')
