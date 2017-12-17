// Native
const path = require('path')

// Packages
const fs = require('fs-extra')
const { compile } = require('handlebars')

module.exports = (view = 'index') => {
  let viewContent = false
  const viewPath = path.normalize(path.join(__dirname, `/../views/${view}.hbs`))

  try {
    viewContent = fs.readFileSync(viewPath, 'utf8')
  } catch (err) {
    throw err
  }

  return compile(viewContent)
}
