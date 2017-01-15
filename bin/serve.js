#!/usr/bin/env node

// Packages
const asyncToGen = require('async-to-gen/register')
const updateNotifier = require('update-notifier')

// Ours
const pkg = require('../package')

asyncToGen({
  excludes: null
})

// Let user know if there's an update
// This isn't important when deployed to Now
if (!process.env.NOW) {
  updateNotifier({pkg}).notify()
}

require('../lib')
