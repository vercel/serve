// Packages
const {copy} = require('copy-paste')
const ip = require('ip')
const pathType = require('path-type')
const {red} = require('chalk')

const copyToClipboard = async text => {
  try {
    await copy(text)
    return true
  } catch (err) {
    return false
  }
}

module.exports = async (server, current) => {
  const details = server.address()
  const ipAddress = ip.address()
  const url = `http://${ipAddress}:${details.port}`

  process.on('SIGINT', () => {
    server.close()
    process.exit(0)
  })

  if (!await pathType.dir(current)) {
    console.error(red('Specified directory doesn\'t exist!'))
    process.exit(1)
  }

  if (!process.env.NOW) {
    let message = `Running on ${url}`
    const copied = await copyToClipboard(url)

    if (copied) {
      message = `${message} [copied to clipboard]`
    }

    console.log(message)
  }
}
