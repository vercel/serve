// Native
const { spawn } = require('child_process')
const path = require('path')

// Packages
const dargs = require('dargs')

module.exports = (directory = process.cwd(), options = {}) => {
  const scriptPath = path.join(__dirname, '..', 'bin', 'serve.js')
  const aliases = { cors: 'o' }

  options._ = [directory] // Let dargs handle the directory argument

  // The CLI only understands comma-separated values for ignored and hidden files
  // So we join the string array with commas
  if (options.ignore) {
    options.ignore = options.ignore.join(',')
  }

  if (options.noshow) {
    options.noshow = options.noshow.join(',')
  }

  const args = [scriptPath, ...dargs(options, { aliases })]

  const cli = spawn('node', args, {
    stdio: 'inherit'
  })

  return {
    stop() {
      cli.kill()
    }
  }
}
