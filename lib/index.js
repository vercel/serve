// Native
const path = require('path')

// Packages
const micro = require('micro')
const args = require('args')
const compress = require('micro-compress')
const getPort = require('get-port')

// Ours
const listening = require('./listening')
const serverHandler = require('./server')

args
  .option('port', 'Port to listen on', process.env.PORT)
  .option('cache', 'How long static files should be cached in the browser (seconds)', 3600)
  .option('single', 'Serve single page apps with only one index.html')
  .option('unzipped', 'Disable GZIP compression')
  .option('ignore', 'Files and directories to ignore', '')
  .option('auth', 'Serve behind basic auth')
  .option(['o', 'cors'], 'Setup * CORS headers to allow requests from any origin', false)

const flags = args.parse(process.argv)
const directory = args.sub[0]

process.env.ASSET_DIR = '/' + Math.random().toString(36).substr(2, 10)

let current = process.cwd()

if (directory) {
  current = path.resolve(process.cwd(), directory)
}

let ignoredFiles = [
  '.DS_Store',
  '.git/'
]

if (flags.ignore && flags.ignore.length > 0) {
  ignoredFiles = ignoredFiles.concat(flags.ignore.split(','))
}

const handler = async (req, res) => {
  await serverHandler(req, res, flags, current, ignoredFiles)
}

const server = flags.unzipped ? micro(handler) : micro(compress(handler))

getPort().then(randomPort => {
  server.listen(flags.port || randomPort, async () => await listening(server, current))
})
