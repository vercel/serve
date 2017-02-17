// Native
const {spawn} = require('child_process')
const path = require('path')

// { port: 1337 } => ['--port', '1337']
const optionsToArgs = options => {
  const args = []
  for (const prop in options) {
    if (Object.prototype.hasOwnProperty.call(options, prop)) {
      args.push(`--${prop}`, options[prop])
    }
  }
  return args
}

module.exports = (options = {}, directory = process.cwd()) => {
  const scriptPath = path.join(__dirname, '..', 'bin', 'serve.js')

  const cli = spawn('node',
    [scriptPath, ...optionsToArgs(options), directory],
    {stdio: 'inherit'})

  return {
    stop() {
      cli.kill()
    }
  }
}
