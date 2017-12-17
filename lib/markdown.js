// Packages
const fs = require('fs-extra')
const { Converter } = require('showdown')
const { coroutine } = require('bluebird')

// Utilities
const prepareView = require('./view')

const converter = new Converter()

module.exports = coroutine(function*(pathname, related) {
  const render = prepareView('md')
  const raw = yield fs.readFile(related, 'utf-8')
  const content = converter.makeHtml(raw)

  const details = {
    assetDir: process.env.ASSET_DIR,
    current: pathname,
    content
  }

  return render(details)
})
