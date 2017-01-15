#!/usr/bin/env node

// Packages
const asyncToGen = require('async-to-gen/register')
const updateNotifier = require('update-notifier')
const {red} = require('chalk')
const nodeVersion = require('node-version')

// Ours
const pkg = require('../package')

// Support for keywords "async" and "await"
asyncToGen({
  excludes: null
})

// Throw an error if node version is too low
if (nodeVersion.major < 6) {
  console.error(`${red('Error!')} Serve requires at least version 6 of Node. Please upgrade!`)
  process.exit(1)
}

// Let user know if there's an update
// This isn't important when deployed to Now
if (!process.env.NOW) {
  updateNotifier({pkg}).notify()
}

// Load package core with async/await support
require('../lib')
