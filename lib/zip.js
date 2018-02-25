// Packages
const fs = require('fs-extra')
const { coroutine } = require('bluebird')
const FolderZip = require('folder-zip')

module.exports = coroutine(function*(current, dir, ignoredFiles) {
  let files = []

  if (!fs.existsSync(dir)) {
    return false
  }

  try {
    files = yield fs.readdir(dir)
  } catch (err) {
    throw err
  }

  const archive = new FolderZip()

  const promises = []
  for (let file of files) {
    const fullPath = dir + '/' + file

    let fileStats
    try {
      fileStats = yield fs.stat(fullPath)
    } catch (err) {
      throw err
    }

    if (fileStats.isDirectory()) file += '/'

    if (ignoredFiles.indexOf(file) > -1) {
      continue
    }

    promises.push(
      new Promise((resolve, reject) => {
        function zipCallBack(error, zip) {
          if (error) reject(error)
          else resolve(zip)
        }
        if (fileStats.isDirectory())
          archive.zipFolder(fullPath, {}, zipCallBack)
        else archive.addFile(file, fullPath, zipCallBack)
      })
    )
  }

  yield Promise.all(promises)

  return archive
})
