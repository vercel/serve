// Native
const path = require('path')

// Packages
const pathType = require('path-type')
const filesize = require('filesize')
const fs = require('fs-promise')
const ip = require('ip')

// Ours
const prepareView = require('./view')

module.exports = async (port, current, dir, ignoredFiles) => {
  let files = []
  const subPath = path.relative(current, dir)

  if (!fs.existsSync(dir)) {
    return false
  }

  try {
    files = await fs.readdir(dir)
  } catch (err) {
    throw err
  }

  for (const file of files) {
    const filePath = path.resolve(dir, file)
    const index = files.indexOf(file)
    const details = path.parse(filePath)

    details.relative = path.join(subPath, details.base)

    if (await pathType.dir(filePath)) {
      details.base += '/'
    } else {
      details.ext = details.ext.split('.')[1] || 'txt'

      let fileStats

      try {
        fileStats = await fs.stat(filePath)
      } catch (err) {
        throw err
      }

      details.size = filesize(fileStats.size, {round: 0})
    }

    if (ignoredFiles.indexOf(details.base) > -1) {
      delete files[index]
    } else {
      files[files.indexOf(file)] = details
    }
  }

  const directory = path.join(path.basename(current), subPath, '/')
  const pathParts = directory.split(path.sep)

  if (dir.indexOf(current + '/') > -1) {
    const directoryPath = [...pathParts]
    directoryPath.shift()

    files.unshift({
      base: '..',
      relative: path.join(...directoryPath, '..')
    })
  }

  const render = prepareView()

  const paths = []
  pathParts.pop()

  for (const part in pathParts) {
    if (!{}.hasOwnProperty.call(pathParts, part)) {
      continue
    }

    let before = 0
    const parents = []

    while (before <= part) {
      parents.push(pathParts[before])
      before++
    }

    parents.shift()

    paths.push({
      name: pathParts[part],
      url: parents.join('/')
    })
  }

  const details = {
    address: ip.address(),
    port,
    files,
    assetDir: process.env.ASSET_DIR,
    directory,
    nodeVersion: process.version.split('v')[1],
    paths
  }

  return render(details)
}
