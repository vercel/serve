// Packages
const {write: copy} = require('clipboardy')
const ip = require('ip')
const pathType = require('path-type')
const chalk = require('chalk')
const boxen = require('boxen')
const {coroutine} = require('bluebird')

module.exports = coroutine(function * (server, current, inUse) {
  const details = server.address()
  const isTTY = process.stdout.isTTY

  process.on('SIGINT', () => {
    server.close()
    process.exit(0)
  })

  let isDir

  try {
    isDir = yield pathType.dir(current)
  } catch (err) {
    isDir = false
  }

  if (!isDir) {
    console.error(chalk.red('Specified directory doesn\'t exist!'))
    process.exit(1)
  }

  if (process.env.NODE_ENV !== 'production') {
    let message = chalk.green('Serving!')

    if (inUse) {
      message += ' ' + chalk.red(`(on port ${inUse.open},` +
      ` because ${inUse.old} is already in use)`)
    }

    message += '\n\n'

    const localURL = `http://localhost:${details.port}`
    message += `- ${chalk.bold('Local:           ')} ${localURL}`

    try {
      const ipAddress = ip.address()
      const url = `http://${ipAddress}:${details.port}`

      message += `\n- ${chalk.bold('On Your Network: ')} ${url}`
    } catch (err) {}

    if (isTTY) {
      try {
        yield copy(localURL)
        message += `\n\n${chalk.grey('Copied local address to clipboard!')}`
      } catch (err) {}
    }

    console.log(boxen(message, {
      padding: 1,
      borderColor: 'green',
      margin: 1
    }))
  }
})
