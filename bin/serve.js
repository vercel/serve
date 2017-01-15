#!/usr/bin/env node

// Packages
const asyncToGen = require('async-to-gen/register')

asyncToGen({
  excludes: null
})

require('../lib')
