// Native
const {spawn} = require('child_process')
const path = require('path')

// Packages
const dargs = require('dargs')

module.exports = (options = {}, directory = process.cwd()) => {
  const scriptPath = path.join(__dirname, '..', 'bin', 'serve.js')
  const aliases = {cors: 'o'}

  options._ = [directory]  // Let dargs handle the directory argument

  const args = [
    scriptPath,
    ...dargs(options, {aliases})
  ]

  const cli = spawn('node', args, {
    stdio: 'inherit'
  })

  return {
    stop() {
      cli.kill()
    }
  }
}
