// Native
const path = require('path')

// Packages
const fs = require('fs-promise')
const { compile } = require('handlebars')

module.exports = () => {
  let viewContent = false
  const viewPath = path.normalize(path.join(__dirname, '/../views/index.hbs'))

  try {
    viewContent = fs.readFileSync(viewPath, 'utf8')
  } catch (err) {
    throw err
  }

  return compile(viewContent)
}
