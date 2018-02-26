// Native
const { basename } = require('path')

// Packages
const { write: copy } = require('clipboardy')
const ip = require('ip')
const pathType = require('path-type')
const chalk = require('chalk')
const boxen = require('boxen')
const { coroutine } = require('bluebird')
const opn = require('opn')

module.exports = coroutine(function*(
  server,
  current,
  inUse,
  clipboard,
  open,
  ssl,
  isLocal
) {
  const details = server.address()
  const { isTTY } = process.stdout

  const shutdown = () => {
    server.close()

    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  let isDir

  try {
    isDir = yield pathType.dir(current)
  } catch (err) {
    isDir = false
  }

  if (!isDir) {
    const base = basename(current)

    console.error(
      chalk.red(`Specified directory ${chalk.bold(`"${base}"`)} doesn't exist!`)
    )

    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1)
  }

  if (process.env.NODE_ENV !== 'production') {
    let message = chalk.green('Serving!')

    if (inUse) {
      message +=
        ' ' +
        chalk.red(
          `(on port ${inUse.open}, because ${inUse.old} is already in use)`
        )
    }

    message += '\n\n'

    const localURL = `http${ssl ? 's' : ''}://localhost:${details.port}`
    message += `- ${chalk.bold('Local:           ')} ${localURL}`

    if (!isLocal) {
      try {
        const ipAddress = ip.address()
        const url = `http${ssl ? 's' : ''}://${ipAddress}:${details.port}`

        message += `\n- ${chalk.bold('On Your Network: ')} ${url}`
      } catch (err) {}
    }

    if (isTTY && clipboard) {
      try {
        yield copy(localURL)
        message += `\n\n${chalk.grey('Copied local address to clipboard!')}`
      } catch (err) {}
    }

    if (isTTY && open) {
      try {
        opn(localURL)
      } catch (err) {}
    }

    if (!isTTY) {
      console.log(`serve: Running on port ${details.port}`)
      return
    }

    console.log(
      boxen(message, {
        padding: 1,
        borderColor: 'green',
        margin: 1
      })
    )
  }
})
