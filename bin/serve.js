#!/usr/bin/env node

// Native
const path = require('path')

// Packages
const micro = require('micro')
const args = require('args')
const compress = require('micro-compress')
const detect = require('detect-port')
const { coroutine } = require('bluebird')
const updateNotifier = require('update-notifier')
const { red } = require('chalk')
const nodeVersion = require('node-version')

// Ours
const pkg = require('../package')
const listening = require('../lib/listening')
const serverHandler = require('../lib/server')

// Throw an error if node version is too low
if (nodeVersion.major < 6) {
  console.error(
    `${red('Error!')} Serve requires at least version 6 of Node. Please upgrade!`
  )
  process.exit(1)
}

// Let user know if there's an update
// This isn't important when deployed to production
if (process.env.NODE_ENV !== 'production' && pkg.dist) {
  updateNotifier({ pkg }).notify()
}

args
  .option('port', 'Port to listen on', process.env.PORT || 5000)
  .option(
    'cache',
    'Time in milliseconds for caching files in the browser',
    3600
  )
  .option('single', 'Serve single page apps with only one index.html')
  .option('unzipped', 'Disable GZIP compression')
  .option('ignore', 'Files and directories to ignore')
  .option('auth', 'Serve behind basic auth')
  .option(
    'cors',
    'Setup * CORS headers to allow requests from any origin',
    false
  )
  .option('silent', `Don't log anything to the console`)
  .option('no-clipboard', `Don't copy address to clipboard`, false)
  .option('open', 'Open local address in browser', false)
const flags = args.parse(process.argv, {
  minimist: {
    alias: {
      a: 'auth',
      C: 'cors',
      S: 'silent',
      s: 'single',
      u: 'unzipped',
      n: 'no-clipboard',
      o: 'open'
    },
    boolean: ['auth', 'cors', 'silent', 'single', 'unzipped', 'no-clipboard', 'open']
  }
})

const directory = args.sub[0]

// Don't log anything to the console if silent mode is enabled
if (flags.silent) {
  console.log = () => {}
}

process.env.ASSET_DIR = '/' + Math.random().toString(36).substr(2, 10)

let current = process.cwd()

if (directory) {
  current = path.resolve(process.cwd(), directory)
}

let ignoredFiles = ['.DS_Store', '.git/']

if (flags.ignore && flags.ignore.length > 0) {
  ignoredFiles = ignoredFiles.concat(flags.ignore.split(','))
}

const handler = coroutine(function*(req, res) {
  yield serverHandler(req, res, flags, current, ignoredFiles)
})

const server = flags.unzipped ? micro(handler) : micro(compress(handler))
let port = flags.port

detect(port).then(open => {
  let inUse = open !== port

  if (inUse) {
    port = open

    inUse = {
      old: flags.port,
      open
    }
  }

  server.listen(
    port,
    coroutine(function*() {
      yield listening(server, current, inUse, flags.noClipboard !== true, flags.open)
    })
  )
})
