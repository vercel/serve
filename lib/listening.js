// Native
const {lstatSync} = require('fs')

// Packages
const {copy} = require('copy-paste')
const ip = require('ip')
const chalk = require('chalk')
const boxen = require('boxen')
const {coroutine, promisify} = require('bluebird')

const copyAsync = promisify(copy)

module.exports = coroutine(function * (server, current, inUse) {
  const details = server.address()
  const isTTY = process.stdout.isTTY

  process.on('SIGINT', () => {
    server.close()
    process.exit(0)
  })

  try {
    lstatSync(current).isDirectory()
  } catch (err) {
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

    if (isTTY && process.platform !== 'linux') {
      try {
        yield copyAsync(localURL)
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
